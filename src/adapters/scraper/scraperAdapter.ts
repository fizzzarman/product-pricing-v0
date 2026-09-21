import * as cheerio from "cheerio";
import type { RetailerAdapter } from "@/adapters/base/types";
import { AdapterError } from "@/adapters/base/types";
import type { RetailerProduct } from "@/types";
import type { Availability } from "@prisma/client";
import { isScrapingAllowed, sleep } from "@/lib/retailers/robots";

const DEFAULT_USER_AGENT = "DaamKotoBot/1.0 (+https://daamkoto.example.com/about-daamkotobot)";

export interface SelectorSet {
  /** CSS selector matching one product "card" within a search/listing page. */
  item: string;
  /** Selector for the title text, relative to `item`. */
  title: string;
  /** Selector for the price text, relative to `item`. */
  price: string;
  /** Selector for the product link, relative to `item`. Reads `href` unless urlAttr is set. */
  url: string;
  urlAttr?: string;
  /** Selector for the product image, relative to `item`. Reads `src` unless imageAttr is set. */
  image?: string;
  imageAttr?: string;
  /** Selector for stock/availability text, relative to `item`. */
  availabilityText?: string;
}

export interface ScraperAdapterConfig {
  key: string;
  retailerName: string;
  baseUrl: string;
  /** `{query}` is replaced with the URL-encoded search term. */
  searchUrlTemplate: string;
  searchSelectors: SelectorSet;
  /** Optional dedicated selectors for a single product page; falls back to searchSelectors shape if omitted. */
  productSelectors?: SelectorSet & { description?: string };
  /** Substrings (case-insensitive) in availability text that mean "out of stock". Defaults to a common EN/BN set. */
  outOfStockKeywords?: string[];
  lowStockKeywords?: string[];
  preOrderKeywords?: string[];
  userAgent?: string;
  /** Minimum delay between requests to this host, in ms (politeness — also raised to robots.txt Crawl-delay if higher). */
  minRequestIntervalMs?: number;
}

const DEFAULT_OUT_OF_STOCK = ["out of stock", "out-of-stock", "stock out", "unavailable", "স্টক নেই"];
const DEFAULT_LOW_STOCK = ["low stock", "few left", "limited stock", "কম স্টক"];
const DEFAULT_PRE_ORDER = ["pre-order", "pre order", "preorder", "প্রি-অর্ডার"];

/**
 * A single retailer adapter driven entirely by config (DataSource.config in
 * the DB) rather than per-site code. Onboarding retailer #6..#50 that has a
 * server-rendered catalog page is then a config row, not a deploy — the
 * architectural goal from the project brief. Sites that render their catalog
 * client-side (heavy JS/SPA) won't work with this adapter; they need a
 * headless-browser adapter run from the external worker path (spec §21)
 * instead, since Vercel serverless functions aren't a good fit for that.
 */
export class ScraperAdapter implements RetailerAdapter {
  readonly key: string;
  readonly retailerName: string;
  private lastRequestAt = 0;

  constructor(private readonly config: ScraperAdapterConfig) {
    this.key = config.key;
    this.retailerName = config.retailerName;
  }

  async searchProducts(query: string): Promise<RetailerProduct[]> {
    const url = this.config.searchUrlTemplate.replace("{query}", encodeURIComponent(query));
    const html = await this.fetchHtml(url);
    const $ = cheerio.load(html);
    const selectors = this.config.searchSelectors;

    const products: RetailerProduct[] = [];
    $(selectors.item).each((_, el) => {
      const $el = $(el);
      const product = this.parseItem($, $el, selectors);
      if (product) products.push(product);
    });

    return products;
  }

  async getProduct(url: string): Promise<RetailerProduct> {
    const html = await this.fetchHtml(url);
    const $ = cheerio.load(html);
    const selectors = this.config.productSelectors ?? this.config.searchSelectors;

    const product = this.parseItem($, $.root(), selectors, url);
    if (!product) throw new AdapterError(this.key, `Failed to parse product page: ${url}`);
    return product;
  }

  async getProductAvailability(product: RetailerProduct): Promise<Availability> {
    const fresh = await this.getProduct(product.url);
    return fresh.availability;
  }

  private parseItem(
    $: cheerio.CheerioAPI,
    $scope: cheerio.Cheerio<any>, // eslint-disable-line @typescript-eslint/no-explicit-any -- matches both $.root() and a per-item selection
    selectors: SelectorSet,
    knownUrl?: string
  ): RetailerProduct | null {
    const title = $scope.find(selectors.title).first().text().trim() || $scope.find(selectors.title).text().trim();
    const priceText = $scope.find(selectors.price).first().text();
    const price = this.parsePrice(priceText);

    let url = knownUrl ?? null;
    if (!url) {
      const $urlEl = $scope.find(selectors.url).first();
      const rawUrl = selectors.urlAttr ? $urlEl.attr(selectors.urlAttr) : $urlEl.attr("href");
      url = rawUrl ?? null;
      if (url && !url.startsWith("http")) {
        url = new URL(url, this.config.baseUrl).toString();
      }
    }

    if (!title || !price || !url) return null;

    let imageUrl: string | null = null;
    if (selectors.image) {
      const $imgEl = $scope.find(selectors.image).first();
      imageUrl = (selectors.imageAttr ? $imgEl.attr(selectors.imageAttr) : $imgEl.attr("src")) ?? null;
      if (imageUrl && !imageUrl.startsWith("http")) imageUrl = new URL(imageUrl, this.config.baseUrl).toString();
    }

    const availabilityText = selectors.availabilityText ? $scope.find(selectors.availabilityText).text() : "";

    return {
      externalId: null,
      url,
      title,
      price,
      currency: "BDT",
      availability: this.parseAvailability(availabilityText),
      stockQuantity: null,
      imageUrl,
      description: null,
    };
  }

  /** Strips currency symbols/commas/BD-locale grouping and parses the remaining digits. */
  private parsePrice(text: string): number | null {
    const digitsOnly = text.replace(/[^\d.]/g, "");
    const value = parseFloat(digitsOnly);
    return Number.isFinite(value) && value > 0 ? value : null;
  }

  private parseAvailability(text: string): Availability {
    const normalized = text.trim().toLowerCase();
    if (!normalized) return "UNKNOWN";

    const outOfStock = this.config.outOfStockKeywords ?? DEFAULT_OUT_OF_STOCK;
    const lowStock = this.config.lowStockKeywords ?? DEFAULT_LOW_STOCK;
    const preOrder = this.config.preOrderKeywords ?? DEFAULT_PRE_ORDER;

    if (outOfStock.some((kw) => normalized.includes(kw))) return "OUT_OF_STOCK";
    if (preOrder.some((kw) => normalized.includes(kw))) return "PRE_ORDER";
    if (lowStock.some((kw) => normalized.includes(kw))) return "LOW_STOCK";
    return "IN_STOCK";
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

    const minInterval = Math.max(
      this.config.minRequestIntervalMs ?? 1000,
      (crawlDelaySeconds ?? 0) * 1000
    );
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
