import type { RetailerProduct } from "@/types";
import type { Availability } from "@/generated/prisma/client";

/**
 * Contract every retailer integration implements, whether it's backed by an
 * official API, an affiliate feed, permitted scraping, or (for V1) mock data.
 * Product pages, search, and the admin sync job all talk to this interface —
 * never to a specific retailer's HTML or API shape directly.
 */
export interface RetailerAdapter {
  /** Stable key used in DataSource.adapterKey to select this adapter. */
  readonly key: string;
  /** Human-readable retailer name, for logs and the admin dashboard. */
  readonly retailerName: string;

  /** Search the retailer's catalog for a free-text query. */
  searchProducts(query: string): Promise<RetailerProduct[]>;

  /**
   * Walk a category/listing page (following pagination) and return every
   * product card found. Optional — only adapters that can enumerate a
   * catalog implement it; the sync job uses it for DataSource.config.categoryUrls.
   */
  crawlListing?(
    listingUrl: string,
    options?: { maxPages?: number; shouldContinue?: () => boolean }
  ): Promise<RetailerProduct[]>;

  /** Fetch full details (description, images, specs) for a single product page URL. */
  getProduct(url: string): Promise<RetailerProduct>;

  /** Re-check availability only, for cheap/frequent freshness refreshes. */
  getProductAvailability(product: RetailerProduct): Promise<Availability>;
}

export class AdapterError extends Error {
  constructor(
    public readonly adapterKey: string,
    message: string,
    public readonly cause?: unknown
  ) {
    super(`[${adapterKey}] ${message}`);
    this.name = "AdapterError";
  }
}
