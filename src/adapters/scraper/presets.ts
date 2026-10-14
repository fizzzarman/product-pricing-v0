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
        // Star Tech's mega-menu: Appliance › TV › Haier. Its URLs are flat (/haier-television), so the
        // hierarchy comes from the nested menu lists. Level 3 is brand/filter pages whose products are
        // all on the level-2 page, so only levels 1–2 are kept (~1,500 links → one page per category).
        linkSelector: "#main-nav a[href]",
        maxDepth: 2,
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
      // Verified against saved Ryans pages (Oct 2026).
      searchSelectors: {
        item: ".category-single-product",
        // The grid-view name is shortened ("... 8G ..."); the list-view link holds the full name.
        title: ".list-view-text a",
        price: ".cat-sp-text",
        url: ".image-box a",
        image: ".image-box img",
        inStock: 'form[action*="add-to-cart"]',
      },
      productSelectors: {
        title: "h1",
        price: ".new-sp-text",
        // Stock comes from the page's schema.org microdata (itemprop="availability").
        description: ".overview .short-desc-attr",
        images: "#slideshow-items-container img",
        specRow: ".specification-table .table-hr-remove",
        specName: ".att-title",
        specValue: ".att-value",
      },
      minRequestIntervalMs: 2000,
      maxDetailPagesPerRun: 40,
      listingParams: { limit: "100" },
      categoryDiscovery: {
        linkSelector: 'a[href*="/category/"]',
        include: "^/category/.+",
        // Ryans' third menu level is brand pages (All Laptop › Laptop Ram › ADATA); stop at level 2.
        maxDepth: 2,
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
      // Verified against a saved Dazzle category page (Oct 2026): a server-rendered Next.js grid.
      searchSelectors: {
        item: "[data-product-uuid]",
        // The <h3> text also contains the stock label, so read the name from its title attribute.
        title: "h3[title]",
        titleAttr: "title",
        price: 'a.items-baseline > span:first-child',
        url: 'a[href^="/product/"]',
        image: "img",
        availabilityText: "h3 > span:last-child",
      },
      // Product pages weren't sampled yet; these fall back to JSON-LD / OpenGraph.
      productSelectors: {
        title: "h1",
        description: "[class*='description']",
      },
      // 12 products per page and ~1,200 phones: allow ~100+ pages per category.
      maxPagesPerCategory: 150,
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
