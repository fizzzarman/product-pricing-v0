import { prisma } from "@/lib/db/prisma";
import { computePriceSummary } from "@/lib/pricing/summary";
import type { RetailerOffer, PriceSummary } from "@/types";

const STALE_THRESHOLD_MINUTES = 24 * 60;

export async function getProductBySlug(slug: string) {
  const product = await prisma.product.findUnique({
    where: { slug, isActive: true },
    include: {
      brand: true,
      category: { include: { parent: true } },
      listings: {
        include: { retailer: true },
        orderBy: { price: "asc" },
      },
    },
  });

  if (!product) return null;

  const now = new Date();
  const offers: RetailerOffer[] = product.listings.map((listing) => ({
    listingId: listing.id,
    retailerName: listing.retailer.name,
    retailerSlug: listing.retailer.slug,
    retailerLogoUrl: listing.retailer.logoUrl,
    price: Number(listing.price),
    previousPrice: listing.previousPrice ? Number(listing.previousPrice) : null,
    availability: listing.availability,
    stockQuantity: listing.stockQuantity,
    externalUrl: listing.externalUrl,
    lastCheckedAt: listing.lastCheckedAt,
    isStale: (now.getTime() - listing.lastCheckedAt.getTime()) / 60_000 >= STALE_THRESHOLD_MINUTES,
  }));

  // Recompute live rather than trusting the denormalized snapshot, so the
  // detail page is always consistent with the listings actually rendered.
  const priceSummary: PriceSummary = computePriceSummary(
    offers.map((o) => ({ price: o.price, availability: o.availability })),
    product.priceUpdatedAt
  );

  const cheapestAvailableOfferId =
    offers
      .filter((o) => o.availability === "IN_STOCK" || o.availability === "LOW_STOCK" || o.availability === "PRE_ORDER")
      .sort((a, b) => a.price - b.price)[0]?.listingId ?? null;

  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    model: product.model,
    description: product.description,
    imageUrl: product.imageUrl,
    specifications: (product.specifications as Record<string, string> | null) ?? {},
    brand: product.brand,
    category: product.category,
    offers,
    priceSummary,
    cheapestAvailableOfferId,
  };
}

export type ProductDetail = NonNullable<Awaited<ReturnType<typeof getProductBySlug>>>;

export interface PriceHistoryPoint {
  date: Date;
  price: number;
}

const RANGE_DAYS: Record<string, number> = {
  "7d": 7,
  "30d": 30,
  "3m": 90,
  "6m": 180,
  "1y": 365,
};

/** Merges price history across all of a product's listings into one lowest-price-per-day series for the chart. */
export async function getProductPriceHistory(productId: string, range: keyof typeof RANGE_DAYS = "30d") {
  const days = RANGE_DAYS[range] ?? 30;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const points = await prisma.priceHistory.findMany({
    where: { listing: { productId }, recordedAt: { gte: since } },
    orderBy: { recordedAt: "asc" },
    select: { price: true, recordedAt: true },
  });

  // Collapse same-day entries across retailers down to the day's lowest price.
  const byDay = new Map<string, number>();
  for (const point of points) {
    const key = point.recordedAt.toISOString().slice(0, 10);
    const price = Number(point.price);
    if (!byDay.has(key) || price < byDay.get(key)!) byDay.set(key, price);
  }

  return [...byDay.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, price]) => ({ date: new Date(date), price }));
}
