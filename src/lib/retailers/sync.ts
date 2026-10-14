import { prisma } from "@/lib/db/prisma";
import { resolveAdapterForDataSource } from "@/adapters/resolve";
import { findCandidateProducts, matchTitleToCandidates } from "@/lib/products/match";
import { slugify } from "@/lib/products/slugify";
import { computePriceSummary } from "@/lib/pricing/summary";
import type { RetailerProduct } from "@/types";
import type { RetailerAdapter } from "@/adapters/base/types";
import type { Availability } from "@/generated/prisma/client";

export interface SeedQuery {
  query: string;
  categorySlug: string;
}

/** A category/listing page to walk page-by-page; every product on it lands in `categorySlug`. */
export interface CategoryCrawl {
  url: string;
  categorySlug: string;
  /** Defaults to 20 pages. */
  maxPages?: number;
}

interface SyncConfig {
  seedQueries?: SeedQuery[];
  categoryUrls?: CategoryCrawl[];
  /** Product pages opened per run to backfill description/images/specs. Defaults to 0 (off). */
  maxDetailPagesPerRun?: number;
}

export interface SyncOptions {
  /**
   * Wall-clock budget for this retailer. No new page fetch starts after it
   * runs out; whatever was collected so far is still saved. Keep it below the
   * calling route's maxDuration.
   */
  timeBudgetMs?: number;
}

export interface SyncResult {
  retailerId: string;
  status: "SUCCESS" | "PARTIAL" | "FAILED";
  productsSeen: number;
  productsMatched: number;
  errorCount: number;
  errorSummary: string | null;
}

const MATCH_CONFIDENCE_THRESHOLD_FOR_NEW_PRODUCT_REUSE = 0.6;
const DEFAULT_TIME_BUDGET_MS = 240_000;

/**
 * Syncs one retailer:
 *  1. collects product cards from its configured category pages (all pages)
 *     and/or search queries;
 *  2. matches each new listing against the catalog (spec §27) and upserts a
 *     ProductListing + PriceHistory point;
 *  3. opens a capped number of product pages to backfill description,
 *     images and specs for listings that don't have them yet — so a full
 *     catalog is enriched gradually over successive runs.
 *
 * Failures are isolated per query/page/item — one bad HTML page or one
 * unparseable listing must not abort the whole retailer sync (spec §35), and
 * one retailer failing must not affect any other retailer (the caller runs
 * this per-retailer and continues past thrown errors).
 */
export async function syncRetailer(retailerId: string, options: SyncOptions = {}): Promise<SyncResult> {
  const budgetMs = options.timeBudgetMs ?? DEFAULT_TIME_BUDGET_MS;
  const startedAt = Date.now();
  // Crawling stops at 75% of the budget so product-page enrichment always gets a share.
  const hasCrawlTime = () => Date.now() < startedAt + budgetMs * 0.75;
  const hasTime = () => Date.now() < startedAt + budgetMs;

  const retailer = await prisma.retailer.findUnique({
    where: { id: retailerId },
    include: { dataSource: true },
  });

  if (!retailer || !retailer.isActive) {
    return { retailerId, status: "FAILED", productsSeen: 0, productsMatched: 0, errorCount: 1, errorSummary: "Retailer not found or inactive" };
  }
  if (!retailer.dataSource || !retailer.dataSource.isActive) {
    return { retailerId, status: "FAILED", productsSeen: 0, productsMatched: 0, errorCount: 1, errorSummary: "No active data source configured" };
  }

  const dataSource = retailer.dataSource;
  const config = (dataSource.config as SyncConfig | null) ?? {};
  const seedQueries = config.seedQueries ?? [];
  const categoryUrls = config.categoryUrls ?? [];

  const run = await prisma.scraperRun.create({
    data: { dataSourceId: dataSource.id, status: "RUNNING" },
  });

  let productsSeen = 0;
  let productsMatched = 0;
  const errors: string[] = [];
  const touchedProductIds = new Set<string>();
  const seenUrlsThisRun = new Set<string>();

  let adapter: RetailerAdapter;
  try {
    adapter = resolveAdapterForDataSource(dataSource, retailer.name);
  } catch (err) {
    return finalizeRun(run.id, dataSource.id, retailerId, 0, 0, [`Adapter error: ${(err as Error).message}`]);
  }

  if (seedQueries.length === 0 && categoryUrls.length === 0) {
    errors.push("No categoryUrls or seedQueries configured on DataSource.config — nothing to sync.");
  }

  const deferred: string[] = [];

  const ingest = async (results: RetailerProduct[], categorySlug: string) => {
    for (const [index, item] of results.entries()) {
      // DB writes for a big category can outlast the budget too; leave the rest for the next run.
      if (!hasTime()) {
        deferred.push(`${results.length - index} unsaved ${categorySlug} listings`);
        return;
      }
      if (seenUrlsThisRun.has(item.url)) continue;
      seenUrlsThisRun.add(item.url);
      productsSeen++;

      try {
        const productId = await upsertListing(retailerId, item, categorySlug);
        touchedProductIds.add(productId);
        productsMatched++;
      } catch (err) {
        errors.push(`[${item.title}] ${(err as Error).message}`);
      }
    }
  };

  // A full catalog rarely fits in one serverless time budget, so each run
  // starts one category further along; over successive runs every category
  // gets crawled instead of the first few starving the rest.
  const previousRuns = await prisma.scraperRun.count({ where: { dataSourceId: dataSource.id, id: { not: run.id } } });
  const offset = categoryUrls.length > 0 ? previousRuns % categoryUrls.length : 0;
  const orderedCategories = [...categoryUrls.slice(offset), ...categoryUrls.slice(0, offset)];

  for (const category of orderedCategories) {
    if (!hasCrawlTime()) {
      deferred.push(category.url);
      continue;
    }
    if (!adapter.crawlListing) {
      errors.push(`Adapter "${adapter.key}" cannot crawl category pages (${category.url})`);
      continue;
    }
    try {
      const results = await adapter.crawlListing(category.url, { maxPages: category.maxPages, shouldContinue: hasCrawlTime });
      await ingest(results, category.categorySlug);
    } catch (err) {
      errors.push(`[${category.url}] crawl failed: ${(err as Error).message}`);
    }
  }

  for (const seed of seedQueries) {
    if (!hasCrawlTime()) {
      deferred.push(`search "${seed.query}"`);
      continue;
    }
    try {
      await ingest(await adapter.searchProducts(seed.query), seed.categorySlug);
    } catch (err) {
      errors.push(`[${seed.query}] search failed: ${(err as Error).message}`);
    }
  }

  if (deferred.length > 0) {
    errors.push(`Time budget reached; deferred to a later run: ${deferred.join(", ")}`);
  }

  await enrichListingDetails(adapter, retailerId, config.maxDetailPagesPerRun ?? 0, hasTime, errors, touchedProductIds);

  // Batched: a full-catalog crawl touches thousands of products, which would exhaust the DB pool if fired at once.
  const productIds = [...touchedProductIds];
  for (let i = 0; i < productIds.length; i += 10) {
    await Promise.all(productIds.slice(i, i + 10).map(recomputeProductPriceSummary));
  }
  await prisma.dataSource.update({ where: { id: dataSource.id }, data: { lastRunAt: new Date() } });

  return finalizeRun(run.id, dataSource.id, retailerId, productsSeen, productsMatched, errors);
}

/**
 * Creates or refreshes the listing for one scraped product card and records
 * a price-history point. A listing that already exists keeps the product it
 * is linked to: re-matching on every run would let a low-confidence title
 * spawn a fresh duplicate product each sync, and would undo admin relinks.
 */
async function upsertListing(retailerId: string, item: RetailerProduct, categorySlug: string): Promise<string> {
  const existing = await prisma.productListing.findUnique({
    where: { retailerId_externalUrl: { retailerId, externalUrl: item.url } },
    select: { id: true, productId: true, price: true },
  });

  let listingId: string;
  let productId: string;

  if (existing) {
    const oldPrice = Number(existing.price);
    await prisma.productListing.update({
      where: { id: existing.id },
      data: {
        price: item.price,
        ...(oldPrice !== item.price ? { previousPrice: oldPrice } : {}),
        availability: item.availability,
        title: item.title,
        ...(item.imageUrl ? { imageUrl: item.imageUrl } : {}),
        ...(item.description ? { description: item.description } : {}),
        ...(item.externalId ? { externalProductId: item.externalId } : {}),
        lastCheckedAt: new Date(),
      },
    });
    listingId = existing.id;
    productId = existing.productId;
  } else {
    const resolved = await resolveProductId(item, categorySlug);
    productId = resolved.productId;
    const listing = await prisma.productListing.create({
      data: {
        productId,
        retailerId,
        externalProductId: item.externalId,
        externalUrl: item.url,
        price: item.price,
        currency: item.currency,
        availability: item.availability,
        title: item.title,
        description: item.description,
        imageUrl: item.imageUrl,
        matchingStatus: "MATCHED",
        matchConfidence: resolved.confidence,
        lastCheckedAt: new Date(),
      },
    });
    listingId = listing.id;
  }

  await prisma.priceHistory.create({
    data: { listingId, price: item.price, availability: item.availability },
  });

  return productId;
}

/**
 * Opens up to `limit` product pages for this retailer's listings that have
 * no description yet, and copies description / images / specs / stock onto
 * the listing — and onto the canonical product where it has none.
 */
async function enrichListingDetails(
  adapter: RetailerAdapter,
  retailerId: string,
  limit: number,
  hasTime: () => boolean,
  errors: string[],
  touchedProductIds: Set<string>
) {
  if (limit <= 0) return;

  const pending = await prisma.productListing.findMany({
    where: { retailerId, description: null },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      externalUrl: true,
      productId: true,
      product: { select: { description: true, imageUrl: true, specifications: true } },
    },
  });

  for (const listing of pending) {
    if (!hasTime()) break;
    try {
      const detail = await adapter.getProduct(listing.externalUrl);

      await prisma.productListing.update({
        where: { id: listing.id },
        data: {
          // Empty string marks "page fetched, no description found" so the listing isn't retried every run.
          description: detail.description ?? "",
          ...(detail.imageUrl ? { imageUrl: detail.imageUrl } : {}),
          ...(detail.availability !== "UNKNOWN" ? { availability: detail.availability } : {}),
          ...(detail.externalId ? { externalProductId: detail.externalId } : {}),
        },
      });

      const existingSpecs = (listing.product.specifications as Record<string, string> | null) ?? {};
      const scrapedSpecs = detail.specifications ?? {};
      await prisma.product.update({
        where: { id: listing.productId },
        data: {
          ...(!listing.product.description && detail.description ? { description: detail.description } : {}),
          ...(!listing.product.imageUrl && detail.imageUrl ? { imageUrl: detail.imageUrl } : {}),
          ...(Object.keys(scrapedSpecs).length > 0 ? { specifications: { ...scrapedSpecs, ...existingSpecs } } : {}),
        },
      });

      if (detail.availability !== "UNKNOWN") touchedProductIds.add(listing.productId);
    } catch (err) {
      errors.push(`[detail ${listing.externalUrl}] ${(err as Error).message}`);
    }
  }
}

/**
 * Finds an existing canonical product to link this listing to (only when
 * match confidence is high), or creates a new canonical product otherwise.
 * Per spec §27: never auto-merge onto an existing product under uncertainty
 * — creating a new (possibly-duplicate) product that an admin can merge
 * later is the safe default.
 */
async function resolveProductId(
  item: RetailerProduct,
  categorySlug: string
): Promise<{ productId: string; confidence: number }> {
  const candidates = await findCandidateProducts(item.title, 5);
  const match = matchTitleToCandidates(item.title, candidates);

  if (match.status === "MATCHED" && match.productId && match.confidence >= MATCH_CONFIDENCE_THRESHOLD_FOR_NEW_PRODUCT_REUSE) {
    return { productId: match.productId, confidence: match.confidence };
  }

  const category = await prisma.category.findUnique({ where: { slug: categorySlug } });
  if (!category) throw new Error(`Unknown categorySlug "${categorySlug}" in seedQueries config`);

  let brandId: string | undefined;
  if (match.extractedBrand) {
    const brand = await prisma.brand.upsert({
      where: { slug: slugify(match.extractedBrand) },
      update: {},
      create: { name: match.extractedBrand, slug: slugify(match.extractedBrand) },
    });
    brandId = brand.id;
  }

  const baseSlug = slugify(match.normalizedTitle) || slugify(item.title);
  const slug = await uniqueSlug(baseSlug);

  const product = await prisma.product.create({
    data: {
      name: match.normalizedTitle || item.title,
      slug,
      brandId,
      categoryId: category.id,
      description: item.description,
      specifications: { ...match.extractedSpecs, ...(item.specifications ?? {}) },
      imageUrl: item.imageUrl,
    },
  });

  return { productId: product.id, confidence: 1 };
}

async function uniqueSlug(base: string): Promise<string> {
  let slug = base;
  let suffix = 1;
  while (await prisma.product.findUnique({ where: { slug }, select: { id: true } })) {
    suffix++;
    slug = `${base}-${suffix}`;
  }
  return slug;
}

async function recomputeProductPriceSummary(productId: string) {
  const listings = await prisma.productListing.findMany({
    where: { productId },
    select: { price: true, availability: true },
  });

  const summary = computePriceSummary(
    listings.map((l) => ({ price: Number(l.price), availability: l.availability as Availability })),
    new Date()
  );

  await prisma.product.update({
    where: { id: productId },
    data: {
      lowestListedPrice: summary.lowestListedPrice,
      lowestAvailablePrice: summary.lowestAvailablePrice,
      highestPrice: summary.highestPrice,
      averagePrice: summary.averagePrice,
      totalRetailerCount: summary.totalRetailerCount,
      availableRetailerCount: summary.availableRetailerCount,
      priceUpdatedAt: summary.priceUpdatedAt,
    },
  });
}

async function finalizeRun(
  runId: string,
  dataSourceId: string,
  retailerId: string,
  productsSeen: number,
  productsMatched: number,
  errors: string[]
): Promise<SyncResult> {
  const status: SyncResult["status"] =
    errors.length === 0 ? "SUCCESS" : productsMatched > 0 ? "PARTIAL" : "FAILED";

  const errorSummary = errors.length > 0 ? errors.slice(0, 20).join("\n").slice(0, 4000) : null;

  await prisma.scraperRun.update({
    where: { id: runId },
    data: {
      status,
      finishedAt: new Date(),
      productsSeen,
      productsMatched,
      errorCount: errors.length,
      errorSummary,
    },
  });

  return { retailerId, status, productsSeen, productsMatched, errorCount: errors.length, errorSummary };
}
