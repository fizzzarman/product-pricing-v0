import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { PriceComparisonTable } from "@/components/products/price-comparison-table";
import { PriceSummaryStats } from "@/components/products/price-summary-stats";
import { PriceHistoryChart } from "@/components/products/price-history-chart";
import { SpecificationsTable } from "@/components/products/specifications-table";
import { getProductBySlug, getProductPriceHistory } from "@/lib/products/detail";
import { formatBDT } from "@/lib/pricing/currency";

export const revalidate = 180; // ISR: product pages refresh every 3 minutes

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return {};

  const title = `${product.name} Price in Bangladesh | Compare Prices`;
  const description = `Compare ${product.name} prices and availability across Bangladesh's leading computer retailers. ${
    product.priceSummary.lowestAvailablePrice
      ? `Starting from ${formatBDT(product.priceSummary.lowestAvailablePrice)}.`
      : ""
  }`;

  return {
    title,
    description,
    alternates: { canonical: `/products/${product.slug}` },
    openGraph: {
      title,
      description,
      images: product.imageUrl ? [{ url: product.imageUrl }] : undefined,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: product.imageUrl ? [product.imageUrl] : undefined,
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const priceHistory = await getProductPriceHistory(product.id, "30d");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Product",
        name: product.name,
        image: product.imageUrl ?? undefined,
        description: product.description ?? undefined,
        brand: product.brand ? { "@type": "Brand", name: product.brand.name } : undefined,
        model: product.model ?? undefined,
        offers: product.offers.map((offer) => ({
          "@type": "Offer",
          url: offer.externalUrl,
          priceCurrency: "BDT",
          price: offer.price,
          availability:
            offer.availability === "IN_STOCK" || offer.availability === "LOW_STOCK"
              ? "https://schema.org/InStock"
              : offer.availability === "PRE_ORDER"
                ? "https://schema.org/PreOrder"
                : "https://schema.org/OutOfStock",
          seller: { "@type": "Organization", name: offer.retailerName },
        })),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: appUrl },
          {
            "@type": "ListItem",
            position: 2,
            name: product.category.name,
            item: `${appUrl}/categories/${product.category.slug}`,
          },
          { "@type": "ListItem", position: 3, name: product.name, item: `${appUrl}/products/${product.slug}` },
        ],
      },
    ],
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* eslint-disable-next-line @next/next/no-page-custom-font -- structured data script, not a font */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <Breadcrumbs category={product.category} productName={product.name} />

      <div className="grid gap-8 lg:grid-cols-[360px_1fr]">
        {/* Product info */}
        <div>
          <div className="relative aspect-square rounded-lg border bg-muted">
            {product.imageUrl ? (
              <Image
                src={product.imageUrl}
                alt={product.name}
                fill
                sizes="360px"
                className="object-contain p-6"
                priority
              />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                No image available
              </div>
            )}
          </div>

          <div className="mt-4">
            {product.brand && <div className="text-sm text-muted-foreground">{product.brand.name}</div>}
            <h1 className="text-2xl font-bold leading-tight">{product.name}</h1>
            {product.model && <div className="text-sm text-muted-foreground mt-1">Model: {product.model}</div>}
          </div>

          {product.description && (
            <p className="mt-4 text-sm text-muted-foreground leading-relaxed">{product.description}</p>
          )}

          {Object.keys(product.specifications).length > 0 && (
            <div className="mt-6">
              <h2 className="text-sm font-semibold mb-2">Specifications</h2>
              <SpecificationsTable specifications={product.specifications} />
            </div>
          )}
        </div>

        {/* Price comparison + history */}
        <div className="space-y-8">
          <PriceSummaryStats summary={product.priceSummary} />

          <div>
            <h2 className="text-lg font-semibold mb-3">Where to Buy</h2>
            <PriceComparisonTable offers={product.offers} cheapestAvailableOfferId={product.cheapestAvailableOfferId} />
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-3">Price History</h2>
            <PriceHistoryChart
              productSlug={product.slug}
              initialPoints={priceHistory.map((p) => ({ date: p.date.toISOString().slice(0, 10), price: p.price }))}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function Breadcrumbs({
  category,
  productName,
}: {
  category: { name: string; slug: string; parent: { name: string; slug: string } | null };
  productName: string;
}) {
  return (
    <nav aria-label="Breadcrumb" className="mb-5 flex items-center gap-1 text-xs text-muted-foreground flex-wrap">
      <Link href="/" className="hover:text-foreground">
        Home
      </Link>
      {category.parent && (
        <>
          <ChevronRight className="size-3" />
          <Link href={`/categories/${category.parent.slug}`} className="hover:text-foreground">
            {category.parent.name}
          </Link>
        </>
      )}
      <ChevronRight className="size-3" />
      <Link href={`/categories/${category.slug}`} className="hover:text-foreground">
        {category.name}
      </Link>
      <ChevronRight className="size-3" />
      <span className="text-foreground line-clamp-1">{productName}</span>
    </nav>
  );
}
