import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { searchProducts } from "@/lib/search/search";

const querySchema = z.object({
  q: z.string().optional(),
  category: z.string().optional(),
  brand: z.string().optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  inStock: z.coerce.boolean().optional(),
  retailer: z.string().optional(),
  sort: z.enum(["relevance", "price_asc", "price_desc", "newest", "availability"]).optional(),
  page: z.coerce.number().int().positive().optional(),
});

export async function GET(request: NextRequest) {
  const parsed = querySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid query parameters", details: parsed.error.flatten() }, { status: 400 });
  }

  const { q, category, brand, minPrice, maxPrice, inStock, retailer, sort, page } = parsed.data;
  const result = await searchProducts({
    query: q,
    categorySlug: category,
    brandSlug: brand,
    minPrice,
    maxPrice,
    inStockOnly: inStock,
    retailerSlug: retailer,
    sort,
    page,
  });

  return NextResponse.json(result);
}
