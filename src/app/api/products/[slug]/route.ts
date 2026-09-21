import { NextResponse } from "next/server";
import { getProductBySlug } from "@/lib/products/detail";

// Keyed by slug rather than internal id — slugs are the stable public
// identifier used throughout the app's URLs (spec's :id is satisfied by slug here).
export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  return NextResponse.json({ product });
}
