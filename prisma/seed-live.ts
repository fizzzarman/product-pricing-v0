import "dotenv/config";
import { PrismaClient, type Prisma } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

import { CATEGORY_TREE, flattenCategories } from "../src/lib/products/categoryTree";
import { LIVE_RETAILER_PRESETS } from "../src/adapters/scraper/presets";

/**
 * Registers the live retailers (Star Tech, Ryans, Dazzle) as PERMITTED_SCRAPE
 * data sources, using the configs in src/adapters/scraper/presets.ts.
 *
 *   npm run seed:live              # switch to live data, retire mock listings
 *   npm run seed:live -- --keep-mock   # add live sources, leave mock data alone
 *
 * Re-running is safe: it re-applies the preset configs (overwriting manual
 * edits to those DataSource.config rows) and leaves scraped listings intact.
 * After this, trigger a sync from Admin → Retailers → Sync now, or call
 * /api/cron/sync-all with the CRON_SECRET bearer token.
 */

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

const keepMock = process.argv.includes("--keep-mock");

async function ensureCategories() {
  const flat = flattenCategories(CATEGORY_TREE);
  for (const node of flat) {
    await prisma.category.upsert({
      where: { slug: node.slug },
      update: { name: node.name, nameBn: node.nameBn, iconName: node.iconName },
      create: { name: node.name, nameBn: node.nameBn, slug: node.slug, iconName: node.iconName },
    });
  }
  for (const node of flat) {
    if (!node.parentSlug) continue;
    const parent = await prisma.category.findUnique({ where: { slug: node.parentSlug }, select: { id: true } });
    await prisma.category.update({ where: { slug: node.slug }, data: { parentId: parent?.id ?? null } });
  }
}

async function main() {
  console.log("Ensuring categories...");
  await ensureCategories();

  for (const preset of LIVE_RETAILER_PRESETS) {
    const dataSourceId = `live-${preset.key}`;
    const dataSource = await prisma.dataSource.upsert({
      where: { id: dataSourceId },
      update: { config: preset.config as unknown as Prisma.InputJsonValue, baseUrl: preset.websiteUrl, isActive: true },
      create: {
        id: dataSourceId,
        name: `${preset.name} (live scrape)`,
        type: "PERMITTED_SCRAPE",
        baseUrl: preset.websiteUrl,
        adapterKey: preset.key,
        isActive: true,
        config: preset.config as unknown as Prisma.InputJsonValue,
      },
    });

    const existing = await prisma.retailer.findUnique({
      where: { slug: preset.slug },
      include: { dataSource: { select: { type: true } } },
    });

    if (existing?.dataSource?.type === "MOCK" && !keepMock) {
      const { count } = await prisma.productListing.deleteMany({ where: { retailerId: existing.id } });
      console.log(`  ${preset.name}: removed ${count} mock listings`);
    }

    await prisma.retailer.upsert({
      where: { slug: preset.slug },
      update: { name: preset.name, websiteUrl: preset.websiteUrl, dataSourceId: dataSource.id, isActive: true },
      create: { name: preset.name, slug: preset.slug, websiteUrl: preset.websiteUrl, dataSourceId: dataSource.id, isActive: true },
    });
    console.log(`  ${preset.name}: live data source ready`);
  }

  if (!keepMock) {
    // Retire the mock-only retailers and the mock catalog so the site shows scraped data only.
    const liveSlugs = LIVE_RETAILER_PRESETS.map((p) => p.slug);
    const mockRetailers = await prisma.retailer.findMany({
      where: { slug: { notIn: liveSlugs }, dataSource: { type: "MOCK" } },
      select: { id: true, name: true },
    });
    for (const r of mockRetailers) {
      await prisma.productListing.deleteMany({ where: { retailerId: r.id } });
      await prisma.retailer.update({ where: { id: r.id }, data: { isActive: false } });
      console.log(`  ${r.name}: mock retailer deactivated`);
    }

    const { count } = await prisma.product.updateMany({
      where: { listings: { none: {} } },
      data: {
        isActive: false,
        lowestListedPrice: null,
        lowestAvailablePrice: null,
        highestPrice: null,
        averagePrice: null,
        totalRetailerCount: 0,
        availableRetailerCount: 0,
      },
    });
    console.log(`  Hid ${count} products that no longer have any listings`);
  }

  console.log("Done. Run a sync next (Admin → Retailers → Sync now, or GET /api/cron/sync-all).");
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
