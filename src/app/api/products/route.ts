import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { searchProducts } from "@/lib/search/search";

const querySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  category: z.string().optional(),
  brand: z.string().optional(),
});

export async function GET(request: NextRequest) {
  const parsed = querySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid query parameters" }, { status: 400 });
  }

  const result = await searchProducts({
    categorySlug: parsed.data.category,
    brandSlug: parsed.data.brand,
    page: parsed.data.page,
    sort: "newest",
  });

  return NextResponse.json(result);
}
