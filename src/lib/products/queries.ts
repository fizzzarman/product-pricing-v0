import { prisma } from "@/lib/db/prisma";
import type { ProductCardData } from "@/types";
import type { Prisma } from "@/generated/prisma/client";

type ProductWithRelations = Prisma.ProductGetPayload<{
  include: { brand: true; category: true };
}>;

export function toProductCardData(product: ProductWithRelations): ProductCardData {
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    imageUrl: product.imageUrl,
    brandName: product.brand?.name ?? null,
    categoryName: product.category.name,
    priceSummary: {
      lowestListedPrice: product.lowestListedPrice ? Number(product.lowestListedPrice) : null,
      lowestAvailablePrice: product.lowestAvailablePrice ? Number(product.lowestAvailablePrice) : null,
      highestPrice: product.highestPrice ? Number(product.highestPrice) : null,
      averagePrice: product.averagePrice ? Number(product.averagePrice) : null,
      totalRetailerCount: product.totalRetailerCount,
      availableRetailerCount: product.availableRetailerCount,
      priceUpdatedAt: product.priceUpdatedAt,
    },
  };
}

/** Products with the widest retailer coverage — a simple, defensible "trending" proxy for V1. */
export async function getTrendingProducts(limit = 8): Promise<ProductCardData[]> {
  const products = await prisma.product.findMany({
    where: { isActive: true, totalRetailerCount: { gt: 0 } },
    include: { brand: true, category: true },
    orderBy: [{ totalRetailerCount: "desc" }, { availableRetailerCount: "desc" }],
    take: limit,
  });
  return products.map(toProductCardData);
}

export async function getRecentlyUpdatedProducts(limit = 8): Promise<ProductCardData[]> {
  const products = await prisma.product.findMany({
    where: { isActive: true, priceUpdatedAt: { not: null } },
    include: { brand: true, category: true },
    orderBy: { priceUpdatedAt: "desc" },
    take: limit,
  });
  return products.map(toProductCardData);
}

export async function getProductsByCategorySlug(
  categorySlug: string,
  opts: { page?: number; pageSize?: number; sort?: "price_asc" | "price_desc" | "newest" } = {}
): Promise<{ products: ProductCardData[]; total: number }> {
  const page = opts.page ?? 1;
  const pageSize = opts.pageSize ?? 24;

  const orderBy: Prisma.ProductOrderByWithRelationInput =
    opts.sort === "price_asc"
      ? { lowestAvailablePrice: "asc" }
      : opts.sort === "price_desc"
        ? { lowestAvailablePrice: "desc" }
        : opts.sort === "newest"
          ? { createdAt: "desc" }
          : { availableRetailerCount: "desc" };

  const where: Prisma.ProductWhereInput = { isActive: true, category: { slug: categorySlug } };

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: { brand: true, category: true },
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.product.count({ where }),
  ]);

  return { products: products.map(toProductCardData), total };
}

export async function getCategoryBySlug(slug: string) {
  return prisma.category.findUnique({
    where: { slug },
    include: { parent: true, children: { where: { isActive: true }, orderBy: { sortOrder: "asc" } } },
  });
}

/** Top-level + second-level categories for the homepage grid and header nav. */
export async function getBrowsableCategories() {
  return prisma.category.findMany({
    where: { isActive: true, parentId: { not: null } },
    include: { _count: { select: { products: true } } },
    orderBy: { sortOrder: "asc" },
  });
}
