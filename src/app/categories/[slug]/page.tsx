import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { ProductCard } from "@/components/products/product-card";
import { SortSelect } from "@/components/search/sort-select";
import { Badge } from "@/components/ui/badge";
import { getCategoryBySlug, getProductsByCategorySlug } from "@/lib/products/queries";
import { formatBDT } from "@/lib/pricing/currency";

export const revalidate = 300;

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ sort?: string; page?: string }>;
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) return {};

  return {
    title: `${category.name} Price in Bangladesh — Compare & Buy`,
    description:
      category.description ??
      `Browse and compare ${category.name.toLowerCase()} prices and availability across Bangladesh's computer retailers.`,
    alternates: { canonical: `/categories/${category.slug}` },
  };
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const { slug } = await params;
  const { sort, page } = await searchParams;

  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  const sortOption = sort === "price_asc" || sort === "price_desc" || sort === "newest" ? sort : undefined;
  const { products, total } = await getProductsByCategorySlug(slug, {
    sort: sortOption,
    page: page ? Number(page) : 1,
  });

  const prices = products
    .map((p) => p.priceSummary.lowestAvailablePrice)
    .filter((p): p is number => p !== null);
  const priceRange = prices.length > 0 ? { min: Math.min(...prices), max: Math.max(...prices) } : null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-2 text-xs text-muted-foreground">
        <Link href="/" className="hover:text-foreground">
          Home
        </Link>
        {category.parent && (
          <>
            {" / "}
            <Link href={`/categories/${category.parent.slug}`} className="hover:text-foreground">
              {category.parent.name}
            </Link>
          </>
        )}
        {" / "}
        <span className="text-foreground">{category.name}</span>
      </div>

      <h1 className="text-2xl font-bold">{category.name}</h1>
      <p className="text-sm text-muted-foreground mt-1">
        {total} product{total === 1 ? "" : "s"}
        {priceRange && ` · ${formatBDT(priceRange.min)} – ${formatBDT(priceRange.max)}`}
      </p>

      {category.children.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {category.children.map((child) => (
            <Link key={child.id} href={`/categories/${child.slug}`}>
              <Badge variant="outline" className="cursor-pointer hover:bg-secondary">
                {child.name}
              </Badge>
            </Link>
          ))}
        </div>
      )}

      <div className="mt-6 flex justify-end">
        <Suspense fallback={<div className="h-9 w-44" />}>
          <SortSelect />
        </Suspense>
      </div>

      {products.length === 0 ? (
        <div className="mt-8 rounded-lg border border-dashed py-16 text-center text-sm text-muted-foreground">
          No products in this category yet.
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
