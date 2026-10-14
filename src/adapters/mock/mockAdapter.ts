import type { RetailerAdapter } from "@/adapters/base/types";
import type { RetailerProduct } from "@/types";
import type { Availability } from "@/generated/prisma/client";

export interface MockCatalogEntry {
  externalId: string;
  title: string;
  basePrice: number;
  imageUrl?: string | null;
}

export interface MockAdapterConfig {
  key: string;
  retailerName: string;
  baseUrl: string;
  /** Deterministic per-retailer price variance so different mock retailers don't all show identical prices. */
  priceVarianceFraction: number;
  catalog: MockCatalogEntry[];
}

/**
 * A deterministic, in-memory stand-in for a real retailer integration.
 * Real adapters (Star Tech, Ryans, TechLand, ...) implement the same
 * RetailerAdapter interface and can be swapped in via the DataSource
 * registry without touching any app/page code.
 */
export class MockRetailerAdapter implements RetailerAdapter {
  readonly key: string;
  readonly retailerName: string;

  constructor(private readonly config: MockAdapterConfig) {
    this.key = config.key;
    this.retailerName = config.retailerName;
  }

  async searchProducts(query: string): Promise<RetailerProduct[]> {
    const q = query.toLowerCase();
    return this.config.catalog
      .filter((entry) => entry.title.toLowerCase().includes(q))
      .map((entry) => this.toRetailerProduct(entry));
  }

  async getProduct(url: string): Promise<RetailerProduct> {
    const entry = this.config.catalog.find((e) => this.buildUrl(e) === url);
    if (!entry) throw new Error(`[${this.key}] no mock product for url: ${url}`);
    return this.toRetailerProduct(entry);
  }

  async getProductAvailability(product: RetailerProduct): Promise<Availability> {
    return this.deterministicAvailability(product.externalId ?? product.url);
  }

  private toRetailerProduct(entry: MockCatalogEntry): RetailerProduct {
    const priceOffset =
      1 + this.hashToUnitFloat(entry.externalId + this.key) * this.config.priceVarianceFraction * 2 -
      this.config.priceVarianceFraction;
    const price = Math.round((entry.basePrice * priceOffset) / 10) * 10;

    return {
      externalId: entry.externalId,
      url: this.buildUrl(entry),
      title: entry.title,
      price,
      currency: "BDT",
      availability: this.deterministicAvailability(entry.externalId),
      stockQuantity: null,
      imageUrl: entry.imageUrl ?? null,
      description: null,
    };
  }

  private buildUrl(entry: MockCatalogEntry): string {
    return `${this.config.baseUrl}/product/${entry.externalId}`;
  }

  /** Deterministic 0..1 float from a string, so re-running seed/dev doesn't produce flapping data. */
  private hashToUnitFloat(input: string): number {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      hash = (hash << 5) - hash + input.charCodeAt(i);
      hash |= 0;
    }
    return (Math.abs(hash) % 1000) / 1000;
  }

  private deterministicAvailability(seed: string): Availability {
    const bucket = Math.floor(this.hashToUnitFloat(seed + "-avail") * 100);
    if (bucket < 70) return "IN_STOCK";
    if (bucket < 82) return "LOW_STOCK";
    if (bucket < 95) return "OUT_OF_STOCK";
    if (bucket < 99) return "PRE_ORDER";
    return "COMING_SOON";
  }
}
