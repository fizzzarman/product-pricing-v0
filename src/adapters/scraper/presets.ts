import type { ScraperAdapterConfig } from "@/adapters/scraper/scraperAdapter";
import type { CategoryCrawl, SeedQuery } from "@/lib/retailers/sync";

/**
 * DataSource.config presets for the live retailers. `npm run seed:live`
 * writes these into the database; after that the DB row is the source of
 * truth and can be tuned from Prisma Studio without a deploy.
 *
 * Categories aren't listed here: every category on each site is discovered
 * from its navigation menu (`categoryDiscovery`) by Admin → Retailers →
 * Categories → "Sync categories", where the admin can also switch
 * categories off or remap them. The result is stored in config.categoryUrls.
 *
 * ⚠️ The CSS selectors below are written from each site's known markup but
 * could not be verified against the live sites from the build environment.
 * Before relying on them, run `npm run scrape:check -- <retailer>` (see
 * README) and adjust any selector that returns zero products. Every product
 * page parse also falls back to schema.org JSON-LD / OpenGraph tags, so
 * description, images and price usually survive a selector miss.
 */
export type LiveRetailerConfig = Omit<ScraperAdapterConfig, "key" | "retailerName" | "baseUrl"> & {
  categoryUrls?: CategoryCrawl[];
  seedQueries?: SeedQuery[];
  /** How many product pages to open per run to backfill description/images/specs. */
  maxDetailPagesPerRun?: number;
};

export interface LiveRetailerPreset {
  key: string;
  name: string;
  slug: string;
  websiteUrl: string;
  config: LiveRetailerConfig;
}

const STARTECH = "https://www.startech.com.bd";
const RYANS = "https://www.ryans.com";
const DAZZLE = "https://dazzle.com.bd";

export const LIVE_RETAILER_PRESETS: LiveRetailerPreset[] = [
  {
    key: "startech",
    name: "Star Tech",
    slug: "star-tech",
    websiteUrl: STARTECH,
    config: {
      searchUrlTemplate: `${STARTECH}/product/search?search={query}`,
      searchSelectors: {
        item: ".p-item",
        title: ".p-item-name",
        // Discounted items render <span class="price-new"> before <span class="price-old">; parsePrice takes the first number.
        price: ".p-item-price",
        url: ".p-item-name a",
        image: ".p-item-img img",
        availabilityText: ".p-item-price, .actions",
      },
      productSelectors: {
        title: "h1.product-name",
        price: ".product-info-group .product-price, td.product-price",
        availabilityText: ".product-info-group .product-status, td.product-status",
        description: ".short-description, #description",
        images: ".product-img-holder img, .product-images img",
        specRow: "#specification table.data-table tr",
        specName: "td.name",
        specValue: "td.value",
      },
      minRequestIntervalMs: 2000,
      maxDetailPagesPerRun: 40,
      listingParams: { limit: "90" },
      categoryDiscovery: {
        // Star Tech's mega-menu. Leaf entries are the most specific pages (e.g. /component/processor),
        // so nothing is crawled twice.
        linkSelector: "#main-nav a[href]",
        exclude: ["^/(information|account|tool|compare|offers?|blog|contact|checkout|cart|pc-builder|brands?)\\b", "route="],
        level: "leaf",
      },
    },
  },
  {
    key: "ryans",
    name: "Ryans Computers",
    slug: "ryans",
    websiteUrl: RYANS,
    config: {
      searchUrlTemplate: `${RYANS}/search?q={query}`,
      searchSelectors: {
        item: ".category-single-product",
        title: ".product-title, .card-text a",
        price: ".pr-text",
        url: ".image-box a, .product-title a, .card-text a",
        image: ".image-box img",
        availabilityText: ".stock-text, .product-stock, .cart-btn",
      },
      productSelectors: {
        title: "h1",
        price: ".new-reg-text, .rp-block .pr-text, .price-block .pr-text",
        availabilityText: ".stock-text, .product-stock",
        description: ".overview-text, #description, .product-description",
        images: ".product-img-slider img, .basic-information-img img",
        specRow: ".specification-table tr, .table-hover tr",
        specName: "td:nth-child(1), .att-title",
        specValue: "td:nth-child(2), .att-value",
      },
      minRequestIntervalMs: 2000,
      maxDetailPagesPerRun: 40,
      listingParams: { limit: "100" },
      categoryDiscovery: {
        linkSelector: 'a[href*="/category/"]',
        include: "^/category/.+",
        level: "leaf",
      },
    },
  },
  {
    key: "dazzle",
    name: "Dazzle",
    slug: "dazzle",
    websiteUrl: DAZZLE,
    config: {
      // Dazzle's catalog appears to be rendered client-side; search engines index its category
      // pages with navigation only. If the first sync reports 0 products, this retailer needs
      // its JSON API (check the browser network tab) or a headless-browser adapter instead.
      searchSelectors: {
        item: ".product-card, [class*='ProductCard'], [class*='product-card']",
        title: "h2, h3, [class*='title'], [class*='name']",
        price: "[class*='price']",
        url: "a[href*='/products/'], a[href*='/product/'], a",
        image: "img",
        availabilityText: "[class*='stock'], button",
      },
      productSelectors: {
        title: "h1",
        price: "[class*='price']",
        availabilityText: "[class*='stock']",
        description: "[class*='description']",
        images: "[class*='gallery'] img, [class*='slider'] img",
      },
      minRequestIntervalMs: 2000,
      maxDetailPagesPerRun: 40,
      categoryDiscovery: {
        // Top-level only: Dazzle's sub-levels are brands (/categories/phones/xiaomi), already covered by the parent page.
        linkSelector: 'a[href*="/categories/"]',
        include: "^/categories/.+",
        level: "top",
      },
    },
  },
];
