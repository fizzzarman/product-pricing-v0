import * as cheerio from "cheerio";
import type { RetailerAdapter } from "@/adapters/base/types";
import { AdapterError } from "@/adapters/base/types";
import type { RetailerProduct } from "@/types";
import type { Availability } from "@/generated/prisma/client";
import { isScrapingAllowed, sleep } from "@/lib/retailers/robots";
import {
  DEFAULT_AVAILABILITY_KEYWORDS,
  type AvailabilityKeywords,
  cleanText,
  extractJsonLdProducts,
  parseAvailabilityText,
  parsePrice,
  readImageUrl,
  readableText,
  absoluteUrl,
  extractCategoryLinks,
  type CategoryDiscoveryConfig,
  type DiscoveredCategory,
} from "@/adapters/scraper/parse";

const DEFAULT_USER_AGENT = "DaamKotoBot/1.0 (+https://daamkoto.example.com/about-daamkotobot)";
const MAX_DESCRIPTION_LENGTH = 5000;

/** Selectors for one product "card" on a search or category listing page. */
export interface SelectorSet {
  /** CSS selector matching one product "card" within a search/listing page. */
  item: string;
  /** Selector for the title text, relative to `item`. */
  title: string;
  /** Selector for the price text, relative to `item`. The first number found is used. */
  price: string;
  /** Selector for the product link, relative to `item`. Reads `href` unless urlAttr is set. */
  url: string;
  urlAttr?: string;
  /** Selector for the product image, relative to `item`. Reads lazy-load attributes, then `src`, unless imageAttr is set. */
  image?: string;
  imageAttr?: string;
  /** Selector for stock/availability text, relative to `item`. */
  availabilityText?: string;
  /** Selector that, when it matches the item itself or something inside it, marks the item out of stock (e.g. WooCommerce's `.outofstock`). */
  outOfStock?: string;
}

/** Selectors for a single product detail page. Every field is optional — JSON-LD fills the gaps. */
export interface ProductPageSelectors {
  title?: string;
  price?: string;
  availabilityText?: string;
  description?: string;
  /** Matches every gallery <img>; the first becomes the primary image. */
  images?: string;
  imageAttr?: string;
  /** Matches one row of the specification table; specName/specValue are relative to it. */
  specRow?: string;
  specName?: string;
  specValue?: string;
}

export interface ScraperAdapterConfig {
  key: string;
  retailerName: string;
  baseUrl: string;
  /** `{query}` is replaced with the URL-encoded search term. Only needed when the DataSource uses seedQueries. */
  searchUrlTemplate?: string;
  /** Product-card selectors, used for both search result pages and category listing pages. */
  searchSelectors: SelectorSet;
  productSelectors?: ProductPageSelectors;
  /** How to find every category on the site (used by Admin → Retailers → Categories → Sync categories). */
  categoryDiscovery?: CategoryDiscoveryConfig;
  /** Query-string parameter used for listing pagination. Defaults to "page". */
  pageParam?: string;
  /** Extra query parameters added to every category listing URL, e.g. { limit: "90" } for bigger pages. */
  listingParams?: Record<string, string>;
  /** Substrings (case-insensitive) in availability text. Defaults to a common EN/BN set. */
  outOfStockKeywords?: string[];
  lowStockKeywords?: string[];
  preOrderKeywords?: string[];
  comingSoonKeywords?: string[];
  userAgent?: string;
  /** Minimum delay between requests to this host, in ms (politeness — also raised to robots.txt Crawl-delay if higher). */
  minRequestIntervalMs?: number;
}

/**
 * A single retailer adapter driven entirely by config (DataSource.config in
 * the DB) rather than per-site code. Onboarding a retailer that has a
 * server-rendered catalog is then a config row, not a deploy. See
 * src/adapters/scraper/presets.ts for the Star Tech / Ryans / Dazzle configs.
 *
 * Sites that render their catalog client-side (heavy JS/SPA) won't work with
 * this adapter beyond whatever JSON-LD they server-render; they need a
 * headless-browser adapter run from an external worker (spec §21).
 */
export class ScraperAdapter implements RetailerAdapter {
  readonly key: string;
  readonly retailerName: string;
  private lastRequestAt = 0;
  private readonly keywords: AvailabilityKeywords;

  constructor(private readonly config: ScraperAdapterConfig) {
    this.key = config.key;
    this.retailerName = config.retailerName;
    this.keywords = {
      outOfStock: config.outOfStockKeywords ?? DEFAULT_AVAILABILITY_KEYWORDS.outOfStock,
      lowStock: config.lowStockKeywords ?? DEFAULT_AVAILABILITY_KEYWORDS.lowStock,
      preOrder: config.preOrderKeywords ?? DEFAULT_AVAILABILITY_KEYWORDS.preOrder,
      comingSoon: config.comingSoonKeywords ?? DEFAULT_AVAILABILITY_KEYWORDS.comingSoon,
    };
  }

  async searchProducts(query: string): Promise<RetailerProduct[]> {
    if (!this.config.searchUrlTemplate) {
      throw new AdapterError(this.key, "searchUrlTemplate is not configured — use categoryUrls for this retailer");
    }
    const url = this.config.searchUrlTemplate.replace("{query}", encodeURIComponent(query));
    return this.parseListingPage(await this.fetchHtml(url));
  }

  /**
   * Walks a category listing page by page (via `?page=N`) until a page adds
   * no new products, the page cap is hit, or `shouldContinue` says to stop
   * (the sync job's time budget).
   */
  async crawlListing(
    listingUrl: string,
    options: { maxPages?: number; shouldContinue?: () => boolean } = {}
  ): Promise<RetailerProduct[]> {
    const maxPages = options.maxPages ?? 20;
    const pageParam = this.config.pageParam ?? "page";
    const byUrl = new Map<string, RetailerProduct>();

    for (let page = 1; page <= maxPages; page++) {
      if (page > 1 && options.shouldContinue && !options.shouldContinue()) break;

      const url = new URL(listingUrl);
      for (const [name, value] of Object.entries(this.config.listingParams ?? {})) url.searchParams.set(name, value);
      if (page > 1) url.searchParams.set(pageParam, String(page));

      const products = this.parseListingPage(await this.fetchHtml(url.toString()));
      const before = byUrl.size;
      for (const product of products) if (!byUrl.has(product.url)) byUrl.set(product.url, product);

      // Past the last page most sites either return an empty grid or repeat the last page.
      if (byUrl.size === before) break;
    }

    return [...byUrl.values()];
  }

  async discoverCategories(): Promise<DiscoveredCategory[]> {
    const discovery = this.config.categoryDiscovery;
    if (!discovery) throw new AdapterError(this.key, "categoryDiscovery is not configured for this retailer");
    const url = discovery.url ?? this.config.baseUrl;
    return extractCategoryLinks(cheerio.load(await this.fetchHtml(url)), url, discovery);
  }

  async getProduct(url: string): Promise<RetailerProduct> {
    const html = await this.fetchHtml(url);
    const product = this.parseProductPage(html, url);
    if (!product) throw new AdapterError(this.key, `Failed to parse product page: ${url}`);
    return product;
  }

  async getProductAvailability(product: RetailerProduct): Promise<Availability> {
    const fresh = await this.getProduct(product.url);
    return fresh.availability;
  }

  /** Exposed for fixture-based tests. */
  parseListingPage(html: string): RetailerProduct[] {
    const $ = cheerio.load(html);
    const selectors = this.config.searchSelectors;

    const products: RetailerProduct[] = [];
    $(selectors.item).each((_, el) => {
      const product = this.parseListingItem($(el), selectors);
      if (product) products.push(product);
    });

    if (products.length > 0) return products;

    // Fallback: some catalogs embed the grid as JSON-LD ItemList / Product entries.
    return extractJsonLdProducts($, this.config.baseUrl)
      .filter((p) => p.name && p.url && p.price)
      .map((p) => ({
        externalId: p.sku,
        url: p.url!,
        title: p.name!,
        price: p.price!,
        currency: "BDT",
        availability: p.availability,
        stockQuantity: null,
        imageUrl: p.images[0] ?? null,
        description: null,
      }));
  }

  /**
   * Exposed for fixture-based tests. Uses configured selectors first and
   * falls back to the page's schema.org JSON-LD and OpenGraph tags, which
   * most e-commerce platforms emit and which survive theme redesigns far
   * better than CSS class names.
   */
  parseProductPage(html: string, url: string): RetailerProduct | null {
    const $ = cheerio.load(html);
    const s = this.config.productSelectors ?? {};
    const ld = extractJsonLdProducts($, url)[0];
    const text = (selector?: string) => (selector ? cleanText($(selector).first().text()) : "");

    const title = text(s.title) || ld?.name || cleanText($('meta[property="og:title"]').attr("content") ?? "");
    const price = parsePrice(text(s.price)) ?? ld?.price ?? null;
    if (!title || !price) return null;

    const availabilityText = s.availabilityText ? cleanText($(s.availabilityText).text()) : "";
    let availability = parseAvailabilityText(availabilityText, this.keywords);
    if (availability === "UNKNOWN" && ld) availability = ld.availability;

    let description = s.description ? readableText($(s.description).first()) : "";
    if (!description) description = ld?.description ?? cleanText($('meta[property="og:description"]').attr("content") ?? "");

    const images: string[] = [];
    if (s.images) {
      $(s.images).each((_, el) => {
        const src = readImageUrl($(el), url, s.imageAttr);
        if (src && !images.includes(src)) images.push(src);
      });
    }
    if (images.length === 0 && ld) images.push(...ld.images);
    if (images.length === 0) {
      const og = absoluteUrl($('meta[property="og:image"]').attr("content"), url);
      if (og) images.push(og);
    }

    let specifications: Record<string, string> = {};
    if (s.specRow && s.specName && s.specValue) {
      $(s.specRow).each((_, row) => {
        const name = cleanText($(row).find(s.specName!).first().text());
        const value = cleanText($(row).find(s.specValue!).first().text());
        if (name && value) specifications[name] = value;
      });
    }
    if (Object.keys(specifications).length === 0 && ld) specifications = ld.specifications;

    return {
      externalId: ld?.sku ?? null,
      url,
      title,
      price,
      currency: "BDT",
      availability,
      stockQuantity: null,
      imageUrl: images[0] ?? null,
      images,
      description: description ? description.slice(0, MAX_DESCRIPTION_LENGTH) : null,
      specifications,
    };
  }

  private parseListingItem(
    $scope: cheerio.Cheerio<any>, // eslint-disable-line @typescript-eslint/no-explicit-any -- cheerio element type varies by selection
    selectors: SelectorSet
  ): RetailerProduct | null {
    const title = cleanText($scope.find(selectors.title).first().text());
    const price = parsePrice($scope.find(selectors.price).first().text());

    const $urlEl = $scope.find(selectors.url).first();
    const url = absoluteUrl(selectors.urlAttr ? $urlEl.attr(selectors.urlAttr) : $urlEl.attr("href"), this.config.baseUrl);

    if (!title || !price || !url) return null;

    const imageUrl = selectors.image
      ? readImageUrl($scope.find(selectors.image).first(), this.config.baseUrl, selectors.imageAttr)
      : null;

    let availability: Availability = "UNKNOWN";
    if (selectors.outOfStock && ($scope.is(selectors.outOfStock) || $scope.find(selectors.outOfStock).length > 0)) {
      availability = "OUT_OF_STOCK";
    } else if (selectors.availabilityText) {
      availability = parseAvailabilityText($scope.find(selectors.availabilityText).text(), this.keywords);
    }

    return {
      externalId: null,
      url,
      title,
      price,
      currency: "BDT",
      availability,
      stockQuantity: null,
      imageUrl,
      description: null,
    };
  }

  /**
   * Fetches a page, but only after confirming robots.txt allows it and
   * enforcing a minimum interval between requests to this host (spec §6:
   * respect robots.txt, rate limits, and retailer policies).
   */
  private async fetchHtml(url: string): Promise<string> {
    const userAgent = this.config.userAgent ?? DEFAULT_USER_AGENT;
    const { allowed, crawlDelaySeconds } = await isScrapingAllowed(url, userAgent);

    if (!allowed) {
      throw new AdapterError(this.key, `robots.txt disallows fetching ${url}`);
    }

    const minInterval = Math.max(this.config.minRequestIntervalMs ?? 1000, (crawlDelaySeconds ?? 0) * 1000);
    const waitMs = this.lastRequestAt + minInterval - Date.now();
    if (waitMs > 0) await sleep(waitMs);
    this.lastRequestAt = Date.now();

    const res = await fetch(url, {
      headers: { "User-Agent": userAgent, Accept: "text/html" },
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      throw new AdapterError(this.key, `HTTP ${res.status} fetching ${url}`);
    }

    return res.text();
  }
}
