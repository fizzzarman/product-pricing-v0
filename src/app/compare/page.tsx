import type { Metadata } from "next";
import { Suspense } from "react";
import { Scale } from "lucide-react";
import { CompareProductPicker } from "@/components/comparison/compare-product-picker";
import { CompareTable } from "@/components/comparison/compare-table";
import { getProductBySlug, type ProductDetail } from "@/lib/products/detail";

export const metadata: Metadata = {
  title: "Compare Products",
  description: "Compare specs and prices of computer hardware side by side.",
};

interface ComparePageProps {
  searchParams: Promise<{ slugs?: string }>;
}

export default async function ComparePage({ searchParams }: ComparePageProps) {
  const { slugs: slugsParam } = await searchParams;
  const slugs = slugsParam ? slugsParam.split(",").filter(Boolean).slice(0, 4) : [];

  const products = (await Promise.all(slugs.map((slug) => getProductBySlug(slug)))).filter(
    (p): p is ProductDetail => p !== null
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-bold">Compare Products</h1>
      <p className="text-sm text-muted-foreground mt-1">Add up to 4 products to compare specs and prices.</p>

      <div className="mt-5">
        <Suspense fallback={<div className="h-9 w-full max-w-sm" />}>
          <CompareProductPicker currentSlugs={products.map((p) => p.slug)} />
        </Suspense>
      </div>

      <div className="mt-8">
        {products.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-20 text-center">
            <Scale className="size-10 text-muted-foreground mb-3" />
            <h2 className="font-medium">Nothing to compare yet</h2>
            <p className="text-sm text-muted-foreground mt-1">Search for products above to add them here.</p>
          </div>
        ) : products.length === 1 ? (
          <p className="text-sm text-muted-foreground">Add at least one more product to see a comparison.</p>
        ) : (
          <CompareTable products={products} />
        )}
      </div>
    </div>
  );
}
