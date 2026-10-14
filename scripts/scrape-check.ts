import { ScraperAdapter } from "../src/adapters/scraper/scraperAdapter";
import { LIVE_RETAILER_PRESETS } from "../src/adapters/scraper/presets";

/**
 * Dry-run a retailer preset against the live site — no database needed.
 * Discovers the site's categories from its menu, fetches the first page of
 * one category, prints what the listing selectors found, then opens the
 * first product page and prints what the detail selectors / JSON-LD found.
 * Use it to verify or fix selectors.
 *
 *   npm run scrape:check -- startech            # first discovered category
 *   npm run scrape:check -- ryans 3             # 4th discovered category
 *   npm run scrape:check -- dazzle https://dazzle.com.bd/categories/phones
 */
async function main() {
  const [key, target] = process.argv.slice(2);
  const preset = LIVE_RETAILER_PRESETS.find((p) => p.key === key);
  if (!preset) {
    throw new Error(`Usage: scrape-check <${LIVE_RETAILER_PRESETS.map((p) => p.key).join("|")}> [categoryIndex|url]`);
  }

  const adapter = new ScraperAdapter({
    key: preset.key,
    retailerName: preset.name,
    baseUrl: preset.websiteUrl,
    ...preset.config,
  });

  let listingUrl = target?.startsWith("http") ? target : undefined;
  if (!listingUrl) {
    const categories = await adapter.discoverCategories();
    console.log(`Categories discovered from the site menu: ${categories.length}`);
    for (const [i, c] of categories.slice(0, 20).entries()) {
      console.log(`  ${i}. ${[...c.trail, c.name].join(" › ")}  ${c.url}`);
    }
    if (categories.length > 20) console.log(`  … and ${categories.length - 20} more`);
    listingUrl = categories[Number(target ?? 0)]?.url;
    if (!listingUrl) throw new Error("No categories discovered — fix categoryDiscovery.linkSelector in presets.ts");
    console.log();
  }

  console.log(`Listing: ${listingUrl}`);
  const products = await adapter.crawlListing(listingUrl, { maxPages: 1 });
  console.log(`  ${products.length} products parsed`);
  for (const p of products.slice(0, 5)) {
    console.log(`  - ${p.title} | ৳${p.price} | ${p.availability} | ${p.imageUrl ?? "no image"}\n    ${p.url}`);
  }

  if (products.length === 0) {
    console.log("  ⚠ No products — the listing selectors don't match, or the page is rendered client-side.");
    return;
  }

  console.log(`\nProduct page: ${products[0].url}`);
  const detail = await adapter.getProduct(products[0].url);
  console.log(`  title:        ${detail.title}`);
  console.log(`  price:        ৳${detail.price}`);
  console.log(`  availability: ${detail.availability}`);
  console.log(`  images:       ${detail.images?.length ?? 0} (${detail.imageUrl ?? "none"})`);
  console.log(`  description:  ${detail.description ? detail.description.slice(0, 160) + "…" : "none"}`);
  const specs = Object.entries(detail.specifications ?? {});
  console.log(`  specs:        ${specs.length}`);
  for (const [name, value] of specs.slice(0, 8)) console.log(`    ${name}: ${value}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
