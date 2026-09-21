import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SearchBar } from "@/components/search/search-bar";
import { ProductCard } from "@/components/products/product-card";
import { CategoryIcon } from "@/components/products/category-icon";
import { Card } from "@/components/ui/card";
import { getBrowsableCategories, getTrendingProducts, getRecentlyUpdatedProducts } from "@/lib/products/queries";

export const revalidate = 300; // ISR: refresh homepage aggregates every 5 minutes

export default async function HomePage() {
  const [categories, trending, recentlyUpdated] = await Promise.all([
    getBrowsableCategories(),
    getTrendingProducts(8),
    getRecentlyUpdatedProducts(8),
  ]);

  // Only show categories that currently have listable products, plus a curated top set.
  const featuredSlugs = ["laptop", "gpu", "cpu", "monitor", "ssd", "ram", "keyboard", "mouse"];
  const featuredCategories = featuredSlugs
    .map((slug) => categories.find((c) => c.slug === slug))
    .filter((c): c is NonNullable<typeof c> => Boolean(c));

  return (
    <div>
      {/* Hero */}
      <section className="border-b bg-gradient-to-b from-primary/5 to-transparent">
        <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:py-24">
          <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
            Find the Best Hardware Price in Bangladesh
          </h1>
          <p className="mt-4 text-muted-foreground text-base sm:text-lg">
            Compare prices and availability across Bangladesh&apos;s computer retailers.
          </p>
          <div className="mt-8 mx-auto max-w-xl">
            <SearchBar size="lg" />
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-12 space-y-14">
        {/* Popular Categories */}
        <section>
          <h2 className="text-xl font-semibold mb-4">Popular Categories</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {featuredCategories.map((category) => (
              <Link key={category.id} href={`/categories/${category.slug}`}>
                <Card className="items-center gap-2 p-5 text-center transition-shadow hover:shadow-md">
                  <CategoryIcon name={category.iconName} className="size-7 text-primary" />
                  <div className="text-sm font-medium">{category.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {category._count.products} product{category._count.products === 1 ? "" : "s"}
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        {/* Trending Products */}
        {trending.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Trending Products</h2>
              <Link href="/search?q=" className="text-sm text-primary inline-flex items-center gap-1 hover:underline">
                View all <ArrowRight className="size-3.5" />
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {trending.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        )}

        {/* Recently Updated Prices */}
        {recentlyUpdated.length > 0 && (
          <section>
            <h2 className="text-xl font-semibold mb-4">Recently Updated Prices</h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {recentlyUpdated.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
