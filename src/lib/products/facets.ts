import { prisma } from "@/lib/db/prisma";

export async function getFilterFacets() {
  const [categories, brands, retailers] = await Promise.all([
    prisma.category.findMany({
      where: { isActive: true, children: { none: {} } }, // leaf categories only
      orderBy: { name: "asc" },
      select: { slug: true, name: true },
    }),
    prisma.brand.findMany({ orderBy: { name: "asc" }, select: { slug: true, name: true } }),
    prisma.retailer.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { slug: true, name: true },
    }),
  ]);

  return { categories, brands, retailers };
}
