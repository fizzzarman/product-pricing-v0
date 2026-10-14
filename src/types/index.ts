import type { Availability, MatchingStatus } from "@/generated/prisma/client";

export type { Availability, MatchingStatus };

/** A single retailer's price/stock row, as shown in the "Where to Buy" table. */
export interface RetailerOffer {
  listingId: string;
  retailerName: string;
  retailerSlug: string;
  retailerLogoUrl: string | null;
  price: number;
  previousPrice: number | null;
  availability: Availability;
  stockQuantity: number | null;
  externalUrl: string;
  lastCheckedAt: Date;
  isStale: boolean;
}

/** Aggregated pricing figures for a canonical product. */
export interface PriceSummary {
  lowestListedPrice: number | null; // cheapest price regardless of stock
  lowestAvailablePrice: number | null; // cheapest price among in-stock/pre-order listings
  highestPrice: number | null;
  averagePrice: number | null;
  totalRetailerCount: number;
  availableRetailerCount: number;
  priceUpdatedAt: Date | null;
}

/** Card-sized product summary used on search results, category, and homepage grids. */
export interface ProductCardData {
  id: string;
  slug: string;
  name: string;
  imageUrl: string | null;
  brandName: string | null;
  categoryName: string;
  priceSummary: PriceSummary;
}

/** Raw product data as returned by a retailer adapter, before normalization/matching. */
export interface RetailerProduct {
  externalId: string | null;
  url: string;
  title: string;
  price: number;
  currency: string;
  availability: Availability;
  stockQuantity: number | null;
  imageUrl: string | null;
  description: string | null;
  /** All gallery images found on the product page, first one being the primary image. */
  images?: string[];
  /** Key/value spec sheet scraped from the product page. */
  specifications?: Record<string, string>;
  raw?: Record<string, unknown>;
}

/** Result of running the normalization/matching pipeline on a RetailerProduct. */
export interface MatchResult {
  status: MatchingStatus;
  confidence: number; // 0..1
  productId: string | null; // set when status is MATCHED
  normalizedTitle: string;
  extractedBrand: string | null;
  extractedModel: string | null;
  extractedSpecs: Record<string, string>;
}

export type FreshnessLevel = "fresh" | "recent" | "stale";
