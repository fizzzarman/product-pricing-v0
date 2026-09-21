import { prisma } from "@/lib/db/prisma";
import { resolveAdapterForDataSource } from "@/adapters/resolve";
import { findCandidateProducts, matchTitleToCandidates } from "@/lib/products/match";
import { slugify } from "@/lib/products/slugify";
import { computePriceSummary } from "@/lib/pricing/summary";
import type { RetailerProduct } from "@/types";
import type { Availability } from "@prisma/client";

export interface SeedQuery {
  query: string;
  categorySlug: string;
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

/**
 * Syncs one retailer: runs its adapter's searchProducts over the retailer's
 * configured seed queries, matches each result against the existing catalog
 * (spec §27), and upserts a ProductListing + a PriceHistory point for each.
 *
 * Deliberately isolates failures per query and per item — one bad HTML page
 * or one unparseable listing must not abort the whole retailer sync (spec
 * §35), and one retailer failing must not affect any other retailer (the
 * caller runs this per-retailer and continues past thrown errors).
 */
export async function syncRetailer(retailerId: string): Promise<SyncResult> {
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
  const config = (dataSource.config as { seedQueries?: SeedQuery[] } | null) ?? {};
  const seedQueries = config.seedQueries ?? [];

  const run = await prisma.scraperRun.create({
    data: { dataSourceId: dataSource.id, status: "RUNNING" },
  });

  let productsSeen = 0;
  let productsMatched = 0;
  const errors: string[] = [];
  const touchedProductIds = new Set<string>();
  const seenUrlsThisRun = new Set<string>();

  let adapter;
  try {
    adapter = resolveAdapterForDataSource(dataSource, retailer.name);
  } catch (err) {
    return finalizeRun(run.id, dataSource.id, retailerId, 0, 0, [`Adapter error: ${(err as Error).message}`]);
  }

  if (seedQueries.length === 0) {
    errors.push("No seedQueries configured on DataSource.config — nothing to sync.");
  }

  for (const seed of seedQueries) {
    let results: RetailerProduct[];
    try {
      results = await adapter.searchProducts(seed.query);
    } catch (err) {
      errors.push(`[${seed.query}] search failed: ${(err as Error).message}`);
      continue;
    }

    for (const item of results) {
      if (seenUrlsThisRun.has(item.url)) continue;
      seenUrlsThisRun.add(item.url);
      productsSeen++;

      try {
        const productId = await resolveProductId(item, seed.categorySlug);
        touchedProductIds.add(productId);

        const listing = await prisma.productListing.upsert({
          where: { retailerId_externalUrl: { retailerId, externalUrl: item.url } },
          update: {
            price: item.price,
            availability: item.availability,
            title: item.title,
            imageUrl: item.imageUrl,
            lastCheckedAt: new Date(),
            productId,
          },
          create: {
            productId,
            retailerId,
            externalProductId: item.externalId,
            externalUrl: item.url,
            price: item.price,
            currency: item.currency,
            availability: item.availability,
            title: item.title,
            imageUrl: item.imageUrl,
            matchingStatus: "MATCHED",
            matchConfidence: 1,
            lastCheckedAt: new Date(),
          },
        });

        await prisma.priceHistory.create({
          data: { listingId: listing.id, price: item.price, availability: item.availability },
        });

        productsMatched++;
      } catch (err) {
        errors.push(`[${item.title}] ${(err as Error).message}`);
      }
    }
  }

  await Promise.all([...touchedProductIds].map(recomputeProductPriceSummary));
  await prisma.dataSource.update({ where: { id: dataSource.id }, data: { lastRunAt: new Date() } });

  return finalizeRun(run.id, dataSource.id, retailerId, productsSeen, productsMatched, errors);
}

/**
 * Finds an existing canonical product to link this listing to (only when
 * match confidence is high), or creates a new canonical product otherwise.
 * Per spec §27: never auto-merge onto an existing product under uncertainty
 * — creating a new (possibly-duplicate) product that an admin can merge
 * later is the safe default.
 */
async function resolveProductId(item: RetailerProduct, categorySlug: string): Promise<string> {
  const candidates = await findCandidateProducts(item.title, 5);
  const match = matchTitleToCandidates(item.title, candidates);

  if (match.status === "MATCHED" && match.productId && match.confidence >= MATCH_CONFIDENCE_THRESHOLD_FOR_NEW_PRODUCT_REUSE) {
    return match.productId;
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
      specifications: match.extractedSpecs,
      imageUrl: item.imageUrl,
    },
  });

  return product.id;
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
