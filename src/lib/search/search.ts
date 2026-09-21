import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import type { ProductCardData } from "@/types";

export type SortOption = "relevance" | "price_asc" | "price_desc" | "newest" | "availability";

export interface SearchFilters {
  query?: string;
  categorySlug?: string;
  brandSlug?: string;
  minPrice?: number;
  maxPrice?: number;
  inStockOnly?: boolean;
  retailerSlug?: string;
  sort?: SortOption;
  page?: number;
  pageSize?: number;
}

interface RawProductRow {
  id: string;
  slug: string;
  name: string;
  imageUrl: string | null;
  brandName: string | null;
  categoryName: string;
  lowestListedPrice: number | null;
  lowestAvailablePrice: number | null;
  highestPrice: number | null;
  averagePrice: number | null;
  totalRetailerCount: number;
  availableRetailerCount: number;
  priceUpdatedAt: Date | null;
}

function rowToCardData(row: RawProductRow): ProductCardData {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    imageUrl: row.imageUrl,
    brandName: row.brandName,
    categoryName: row.categoryName,
    priceSummary: {
      lowestListedPrice: row.lowestListedPrice,
      lowestAvailablePrice: row.lowestAvailablePrice,
      highestPrice: row.highestPrice,
      averagePrice: row.averagePrice,
      totalRetailerCount: row.totalRetailerCount,
      availableRetailerCount: row.availableRetailerCount,
      priceUpdatedAt: row.priceUpdatedAt,
    },
  };
}

/**
 * Fuzzy/tolerant product search (spec §8): combines ILIKE substring matching
 * (handles "5070", "rtx5070", "asus rtx 5070 12gb") with pg_trgm similarity
 * (handles minor typos/word-order differences) so users don't need to type
 * an exact product name.
 *
 * Implemented as raw SQL because dynamic ORDER BY-by-relevance and
 * pg_trgm's `similarity()` function aren't expressible through Prisma's
 * query builder. If the catalog outgrows Postgres full-text/trigram search,
 * this function is the seam to swap in Elasticsearch/Meilisearch/Typesense
 * (spec §8) — callers only depend on its (filters) -> {products, total} shape.
 */
export async function searchProducts(
  filters: SearchFilters
): Promise<{ products: ProductCardData[]; total: number }> {
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(60, Math.max(1, filters.pageSize ?? 20));
  const offset = (page - 1) * pageSize;
  const query = filters.query?.trim();

  const conditions: Prisma.Sql[] = [Prisma.sql`p."isActive" = true`];

  if (query) {
    conditions.push(Prisma.sql`(
      p.name ILIKE ${"%" + query + "%"} OR
      p.model ILIKE ${"%" + query + "%"} OR
      p.sku ILIKE ${"%" + query + "%"} OR
      b.name ILIKE ${"%" + query + "%"} OR
      c.name ILIKE ${"%" + query + "%"} OR
      similarity(p.name, ${query}) > 0.15 OR
      similarity(COALESCE(b.name, '') || ' ' || p.name, ${query}) > 0.15
    )`);
  }
  if (filters.categorySlug) conditions.push(Prisma.sql`c.slug = ${filters.categorySlug}`);
  if (filters.brandSlug) conditions.push(Prisma.sql`b.slug = ${filters.brandSlug}`);
  if (filters.minPrice != null) {
    conditions.push(Prisma.sql`COALESCE(p."lowestAvailablePrice", p."lowestListedPrice") >= ${filters.minPrice}`);
  }
  if (filters.maxPrice != null) {
    conditions.push(Prisma.sql`COALESCE(p."lowestAvailablePrice", p."lowestListedPrice") <= ${filters.maxPrice}`);
  }
  if (filters.inStockOnly) conditions.push(Prisma.sql`p."availableRetailerCount" > 0`);
  if (filters.retailerSlug) {
    conditions.push(Prisma.sql`EXISTS (
      SELECT 1 FROM "ProductListing" pl
      JOIN "Retailer" r ON r.id = pl."retailerId"
      WHERE pl."productId" = p.id AND r.slug = ${filters.retailerSlug}
    )`);
  }

  const whereSql = Prisma.join(conditions, " AND ");

  let orderSql = Prisma.sql`p."availableRetailerCount" DESC, p."totalRetailerCount" DESC`;
  if (query) {
    orderSql = Prisma.sql`GREATEST(
      similarity(p.name, ${query}),
      similarity(COALESCE(b.name, '') || ' ' || p.name, ${query})
    ) DESC, p."availableRetailerCount" DESC`;
  }
  switch (filters.sort) {
    case "price_asc":
      orderSql = Prisma.sql`COALESCE(p."lowestAvailablePrice", p."lowestListedPrice") ASC NULLS LAST`;
      break;
    case "price_desc":
      orderSql = Prisma.sql`COALESCE(p."lowestAvailablePrice", p."lowestListedPrice") DESC NULLS LAST`;
      break;
    case "newest":
      orderSql = Prisma.sql`p."createdAt" DESC`;
      break;
    case "availability":
      orderSql = Prisma.sql`p."availableRetailerCount" DESC, p."totalRetailerCount" DESC`;
      break;
  }

  const [rows, countRows] = await Promise.all([
    prisma.$queryRaw<RawProductRow[]>(Prisma.sql`
      SELECT
        p.id, p.slug, p.name, p."imageUrl",
        b.name as "brandName", c.name as "categoryName",
        p."lowestListedPrice"::float8 as "lowestListedPrice",
        p."lowestAvailablePrice"::float8 as "lowestAvailablePrice",
        p."highestPrice"::float8 as "highestPrice",
        p."averagePrice"::float8 as "averagePrice",
        p."totalRetailerCount", p."availableRetailerCount", p."priceUpdatedAt"
      FROM "Product" p
      LEFT JOIN "Brand" b ON b.id = p."brandId"
      JOIN "Category" c ON c.id = p."categoryId"
      WHERE ${whereSql}
      ORDER BY ${orderSql}
      LIMIT ${pageSize} OFFSET ${offset}
    `),
    prisma.$queryRaw<{ count: bigint }[]>(Prisma.sql`
      SELECT COUNT(*)::bigint as count
      FROM "Product" p
      LEFT JOIN "Brand" b ON b.id = p."brandId"
      JOIN "Category" c ON c.id = p."categoryId"
      WHERE ${whereSql}
    `),
  ]);

  return {
    products: rows.map(rowToCardData),
    total: Number(countRows[0]?.count ?? 0),
  };
}
