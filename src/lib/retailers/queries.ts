import { prisma } from "@/lib/db/prisma";

export async function getAllRetailers() {
  const retailers = await prisma.retailer.findMany({
    where: { isActive: true },
    include: {
      _count: { select: { listings: true } },
      listings: { select: { availability: true, lastCheckedAt: true } },
    },
    orderBy: { name: "asc" },
  });

  return retailers.map((r) => {
    const availableCount = r.listings.filter((l) =>
      ["IN_STOCK", "LOW_STOCK", "PRE_ORDER"].includes(l.availability)
    ).length;
    const lastUpdated = r.listings.reduce<Date | null>(
      (latest, l) => (!latest || l.lastCheckedAt > latest ? l.lastCheckedAt : latest),
      null
    );

    return {
      id: r.id,
      name: r.name,
      slug: r.slug,
      websiteUrl: r.websiteUrl,
      logoUrl: r.logoUrl,
      totalProducts: r._count.listings,
      availableProducts: availableCount,
      lastUpdated,
    };
  });
}

export async function getRetailerBySlug(slug: string) {
  const retailer = await prisma.retailer.findUnique({
    where: { slug, isActive: true },
  });
  if (!retailer) return null;

  const listings = await prisma.productListing.findMany({
    where: { retailerId: retailer.id },
    include: { product: { include: { brand: true, category: true } } },
    orderBy: { lastCheckedAt: "desc" },
    take: 60,
  });

  const availableCount = listings.filter((l) =>
    ["IN_STOCK", "LOW_STOCK", "PRE_ORDER"].includes(l.availability)
  ).length;

  return {
    retailer,
    listings,
    stats: {
      totalProducts: listings.length,
      availableProducts: availableCount,
    },
  };
}
