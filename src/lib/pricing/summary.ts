import type { Availability } from "@/generated/prisma/client";
import type { PriceSummary, FreshnessLevel } from "@/types";

export interface ListingForSummary {
  price: number;
  availability: Availability;
}

const AVAILABLE_STATUSES: Availability[] = ["IN_STOCK", "LOW_STOCK", "PRE_ORDER"];

/**
 * Computes the price summary for a product from its listings.
 *
 * Business rule (spec §38): the headline "lowest price" must be the lowest
 * price among currently AVAILABLE listings, not simply the lowest listed
 * price — an out-of-stock listing should never win the price race.
 */
export function computePriceSummary(
  listings: ListingForSummary[],
  priceUpdatedAt: Date | null = null
): PriceSummary {
  if (listings.length === 0) {
    return {
      lowestListedPrice: null,
      lowestAvailablePrice: null,
      highestPrice: null,
      averagePrice: null,
      totalRetailerCount: 0,
      availableRetailerCount: 0,
      priceUpdatedAt,
    };
  }

  const prices = listings.map((l) => l.price);
  const availableListings = listings.filter((l) => AVAILABLE_STATUSES.includes(l.availability));
  const availablePrices = availableListings.map((l) => l.price);

  return {
    lowestListedPrice: Math.min(...prices),
    lowestAvailablePrice: availablePrices.length > 0 ? Math.min(...availablePrices) : null,
    highestPrice: Math.max(...prices),
    averagePrice: Math.round(prices.reduce((sum, p) => sum + p, 0) / prices.length),
    totalRetailerCount: listings.length,
    availableRetailerCount: availableListings.length,
    priceUpdatedAt,
  };
}

/** Configurable freshness thresholds (spec §39). */
export const FRESHNESS_THRESHOLDS_MINUTES = {
  fresh: 60, // < 1 hour: no warning
  recent: 60 * 24, // < 24 hours: shown but not flagged
  // >= 24 hours: flagged as potentially stale
};

export function getFreshness(lastCheckedAt: Date, now: Date = new Date()): FreshnessLevel {
  const minutesAgo = (now.getTime() - lastCheckedAt.getTime()) / 60_000;
  if (minutesAgo < FRESHNESS_THRESHOLDS_MINUTES.fresh) return "fresh";
  if (minutesAgo < FRESHNESS_THRESHOLDS_MINUTES.recent) return "recent";
  return "stale";
}

export function isStale(lastCheckedAt: Date, now: Date = new Date()): boolean {
  return getFreshness(lastCheckedAt, now) === "stale";
}

/** Human-friendly "10 min ago" / "3 days ago" labels (EN). Bengali variant lives in lib/i18n. */
export function relativeTimeFromNow(date: Date, now: Date = new Date()): string {
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  if (hours < 24) return `${hours} hr${hours === 1 ? "" : "s"} ago`;
  if (days < 30) return `${days} day${days === 1 ? "" : "s"} ago`;
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}
