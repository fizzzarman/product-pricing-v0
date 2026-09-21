import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { SearchX } from "lucide-react";
import { SearchFilters } from "@/components/search/search-filters";
import { SortSelect } from "@/components/search/sort-select";
import { ProductCard } from "@/components/products/product-card";
import { Button } from "@/components/ui/button";
import { searchProducts, type SortOption } from "@/lib/search/search";
import { getFilterFacets } from "@/lib/products/facets";

const PAGE_SIZE = 20;

interface SearchPageProps {
  searchParams: Promise<{
    q?: string;
    category?: string;
    brand?: string;
    minPrice?: string;
    maxPrice?: string;
    inStock?: string;
    retailer?: string;
    sort?: string;
    page?: string;
  }>;
}

export async function generateMetadata({ searchParams }: SearchPageProps): Promise<Metadata> {
  const params = await searchParams;
  const q = params.q?.trim();
  return {
    title: q ? `"${q}" — Search Results` : "Search",
    description: q
      ? `Compare prices and availability for "${q}" across Bangladesh's computer retailers.`
      : "Search and compare computer hardware prices across Bangladesh's retailers.",
  };
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);

  const [{ products, total }, facets] = await Promise.all([
    searchProducts({
      query: params.q,
      categorySlug: params.category,
      brandSlug: params.brand,
      minPrice: params.minPrice ? Number(params.minPrice) : undefined,
      maxPrice: params.maxPrice ? Number(params.maxPrice) : undefined,
      inStockOnly: params.inStock === "1",
      retailerSlug: params.retailer,
      sort: (params.sort as SortOption) ?? "relevance",
      page,
      pageSize: PAGE_SIZE,
    }),
    getFilterFacets(),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">
          {params.q ? (
            <>
              Results for &ldquo;{params.q}&rdquo;
            </>
          ) : (
            "All Products"
          )}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {total} product{total === 1 ? "" : "s"} found
        </p>
      </div>

      <div className="flex flex-col gap-8 md:flex-row">
        <Suspense fallback={<div className="w-full md:w-64 shrink-0" />}>
          <SearchFilters categories={facets.categories} brands={facets.brands} retailers={facets.retailers} />
        </Suspense>

        <div className="flex-1">
          <div className="mb-4 flex justify-end">
            <Suspense fallback={<div className="h-9 w-44" />}>
              <SortSelect />
            </Suspense>
          </div>

          {products.length === 0 ? (
            <EmptyState query={params.q} />
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              {totalPages > 1 && (
                <Pagination currentPage={page} totalPages={totalPages} searchParams={params} />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyState({ query }: { query?: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-20 text-center">
      <SearchX className="size-10 text-muted-foreground mb-3" />
      <h2 className="font-medium">No products found</h2>
      <p className="text-sm text-muted-foreground mt-1 max-w-sm">
        {query
          ? `We couldn't find anything matching "${query}". Try a different spelling or a broader term.`
          : "Try adjusting your filters, or search for a product above."}
      </p>
    </div>
  );
}

function Pagination({
  currentPage,
  totalPages,
  searchParams,
}: {
  currentPage: number;
  totalPages: number;
  searchParams: Record<string, string | undefined>;
}) {
  function hrefForPage(page: number) {
    const params = new URLSearchParams(
      Object.entries(searchParams).filter(([, v]) => v !== undefined) as [string, string][]
    );
    params.set("page", String(page));
    return `/search?${params.toString()}`;
  }

  return (
    <div className="mt-8 flex items-center justify-center gap-2">
      <Button variant="outline" size="sm" disabled={currentPage <= 1} asChild={currentPage > 1}>
        {currentPage > 1 ? <Link href={hrefForPage(currentPage - 1)}>Previous</Link> : <span>Previous</span>}
      </Button>
      <span className="text-sm text-muted-foreground px-2">
        Page {currentPage} of {totalPages}
      </span>
      <Button variant="outline" size="sm" disabled={currentPage >= totalPages} asChild={currentPage < totalPages}>
        {currentPage < totalPages ? <Link href={hrefForPage(currentPage + 1)}>Next</Link> : <span>Next</span>}
      </Button>
    </div>
  );
}
