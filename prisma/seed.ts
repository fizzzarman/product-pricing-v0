import "dotenv/config";
import { PrismaClient, type Availability } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

import { CANONICAL_PRODUCTS } from "../src/adapters/mock/seedData";
import { CATEGORY_TREE, flattenCategories } from "../src/lib/products/categoryTree";
import { getAdapter } from "../src/adapters/registry";
import { computePriceSummary } from "../src/lib/pricing/summary";
import { slugify } from "../src/lib/products/slugify";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({
  adapter,
});

const RETAILERS = [
  { key: "mock-startech", name: "Star Tech", slug: "star-tech", websiteUrl: "https://www.startech.com.bd" },
  { key: "mock-ryans", name: "Ryans Computers", slug: "ryans", websiteUrl: "https://www.ryans.com" },
  { key: "mock-techland", name: "TechLand BD", slug: "techland-bd", websiteUrl: "https://www.techlandbd.com" },
  { key: "mock-ucc", name: "UCC", slug: "ucc", websiteUrl: "https://www.ucc.com.bd" },
  {
    key: "mock-computer-source",
    name: "Computer Source",
    slug: "computer-source",
    websiteUrl: "https://www.computersource.com.bd",
  },
] as const;

async function seedCategories() {
  const flat = flattenCategories(CATEGORY_TREE);
  const idBySlug = new Map<string, string>();

  // Two passes: create all nodes first (parentId null), then relink parents,
  // since children reference a parent slug that may not exist yet.
  for (const node of flat) {
    const category = await prisma.category.upsert({
      where: { slug: node.slug },
      update: { name: node.name, nameBn: node.nameBn, iconName: node.iconName },
      create: { name: node.name, nameBn: node.nameBn, slug: node.slug, iconName: node.iconName },
    });
    idBySlug.set(node.slug, category.id);
  }

  for (const node of flat) {
    if (!node.parentSlug) continue;
    await prisma.category.update({
      where: { slug: node.slug },
      data: { parentId: idBySlug.get(node.parentSlug) },
    });
  }

  return idBySlug;
}

async function seedBrands() {
  const brandNames = [...new Set(CANONICAL_PRODUCTS.map((p) => p.brand))];
  const idByName = new Map<string, string>();

  for (const name of brandNames) {
    const brand = await prisma.brand.upsert({
      where: { slug: slugify(name) },
      update: { name },
      create: { name, slug: slugify(name) },
    });
    idByName.set(name, brand.id);
  }

  return idByName;
}

async function seedRetailersAndSources() {
  const retailerIdByKey = new Map<string, string>();

  for (const r of RETAILERS) {
    const dataSource = await prisma.dataSource.upsert({
      where: { id: `seed-${r.key}` }, // deterministic id via upsert-by-id pattern below
      update: { lastRunAt: new Date() },
      create: {
        id: `seed-${r.key}`,
        name: `${r.name} (mock)`,
        type: "MOCK",
        baseUrl: r.websiteUrl,
        adapterKey: r.key,
        isActive: true,
        lastRunAt: new Date(),
      },
    });

    const retailer = await prisma.retailer.upsert({
      where: { slug: r.slug },
      update: { name: r.name, websiteUrl: r.websiteUrl, dataSourceId: dataSource.id },
      create: {
        name: r.name,
        slug: r.slug,
        websiteUrl: r.websiteUrl,
        isActive: true,
        dataSourceId: dataSource.id,
      },
    });

    retailerIdByKey.set(r.key, retailer.id);

    // Demo ScraperRun history for the admin dashboard's "Data Collection" table.
    await prisma.scraperRun.create({
      data: {
        dataSourceId: dataSource.id,
        status: "SUCCESS",
        startedAt: new Date(Date.now() - 20 * 60_000),
        finishedAt: new Date(Date.now() - 18 * 60_000),
        productsSeen: CANONICAL_PRODUCTS.filter((p) => p.retailers.includes(r.key)).length,
        productsMatched: CANONICAL_PRODUCTS.filter((p) => p.retailers.includes(r.key)).length,
        errorCount: 0,
      },
    });
  }

  return retailerIdByKey;
}

/** Generates a plausible price-history random walk ending at `endPrice`, oldest first. */
function generatePriceHistory(endPrice: number, availability: Availability, days: number, points: number) {
  const history: Array<{ price: number; availability: Availability; recordedAt: Date }> = [];
  let price = Math.round(endPrice * (1 + (Math.random() * 0.1 - 0.02)));

  for (let i = points - 1; i >= 0; i--) {
    const daysAgo = Math.round((i / (points - 1)) * days);
    const drift = (Math.random() - 0.5) * 0.03;
    price = i === 0 ? endPrice : Math.round(price * (1 + drift));
    history.push({
      price,
      availability: i === 0 ? availability : "IN_STOCK",
      recordedAt: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000),
    });
  }

  return history;
}

async function seedProductsAndListings(
  categoryIdBySlug: Map<string, string>,
  brandIdByName: Map<string, string>,
  retailerIdByKey: Map<string, string>
) {
  for (const item of CANONICAL_PRODUCTS) {
    const categoryId = categoryIdBySlug.get(item.categorySlug);
    if (!categoryId) throw new Error(`Unknown category slug: ${item.categorySlug}`);

    const product = await prisma.product.upsert({
      where: { slug: item.slug },
      update: {
        name: item.name,
        model: item.model,
        description: item.description,
        specifications: item.specifications,
        imageUrl: item.imageUrl,
        brandId: brandIdByName.get(item.brand),
        categoryId,
      },
      create: {
        name: item.name,
        slug: item.slug,
        model: item.model,
        description: item.description,
        specifications: item.specifications,
        imageUrl: item.imageUrl,
        brandId: brandIdByName.get(item.brand),
        categoryId,
      },
    });

    const listingsForSummary: { price: number; availability: Availability }[] = [];

    for (const retailerKey of item.retailers) {
      const retailerId = retailerIdByKey.get(retailerKey);
      if (!retailerId) continue;

      const adapter = getAdapter(retailerKey);
      const [found] = await adapter.searchProducts(item.name);
      const rp = found ?? {
        externalId: item.slug,
        url: `https://example.com/${retailerKey}/${item.slug}`,
        title: item.name,
        price: item.basePrice,
        currency: "BDT",
        availability: "IN_STOCK" as Availability,
        stockQuantity: null,
        imageUrl: item.imageUrl,
        description: null,
      };

      const listing = await prisma.productListing.upsert({
        where: { retailerId_externalUrl: { retailerId, externalUrl: rp.url } },
        update: {
          price: rp.price,
          availability: rp.availability,
          title: rp.title,
          imageUrl: rp.imageUrl,
          lastCheckedAt: new Date(),
          matchingStatus: "MATCHED",
          matchConfidence: 1,
        },
        create: {
          productId: product.id,
          retailerId,
          externalProductId: rp.externalId,
          externalUrl: rp.url,
          price: rp.price,
          currency: "BDT",
          availability: rp.availability,
          title: rp.title,
          imageUrl: rp.imageUrl,
          matchingStatus: "MATCHED",
          matchConfidence: 1,
          lastCheckedAt: new Date(),
        },
      });

      listingsForSummary.push({ price: rp.price, availability: rp.availability });

      // Seed ~30 days of price history for the price-history chart.
      const history = generatePriceHistory(rp.price, rp.availability, 30, 10);
      await prisma.priceHistory.deleteMany({ where: { listingId: listing.id } });
      await prisma.priceHistory.createMany({
        data: history.map((h) => ({
          listingId: listing.id,
          price: h.price,
          availability: h.availability,
          recordedAt: h.recordedAt,
        })),
      });
    }

    const summary = computePriceSummary(listingsForSummary, new Date());
    await prisma.product.update({
      where: { id: product.id },
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
}

async function main() {
  console.log("Seeding categories...");
  const categoryIdBySlug = await seedCategories();

  console.log("Seeding brands...");
  const brandIdByName = await seedBrands();

  console.log("Seeding retailers + data sources...");
  const retailerIdByKey = await seedRetailersAndSources();

  console.log("Seeding products, listings, and price history...");
  await seedProductsAndListings(categoryIdBySlug, brandIdByName, retailerIdByKey);

  console.log(`Done. Seeded ${CANONICAL_PRODUCTS.length} products across ${RETAILERS.length} retailers.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
