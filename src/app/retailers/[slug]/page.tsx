import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { AvailabilityBadge } from "@/components/products/availability-badge";
import { getRetailerBySlug } from "@/lib/retailers/queries";
import { formatBDT } from "@/lib/pricing/currency";
import { relativeTimeFromNow } from "@/lib/pricing/summary";

export const revalidate = 300;

interface RetailerPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: RetailerPageProps): Promise<Metadata> {
  const { slug } = await params;
  const data = await getRetailerBySlug(slug);
  if (!data) return {};
  return {
    title: `${data.retailer.name} — Prices & Availability`,
    description: `Browse products, prices, and stock availability at ${data.retailer.name} on DaamKoto.`,
  };
}

export default async function RetailerPage({ params }: RetailerPageProps) {
  const { slug } = await params;
  const data = await getRetailerBySlug(slug);
  if (!data) notFound();

  const { retailer, listings, stats } = data;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{retailer.name}</h1>
          <a
            href={retailer.websiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            {retailer.websiteUrl.replace(/^https?:\/\//, "")} <ExternalLink className="size-3.5" />
          </a>
        </div>
        <div className="flex gap-6 text-sm">
          <div>
            <div className="font-semibold">{stats.totalProducts}</div>
            <div className="text-xs text-muted-foreground">Products tracked</div>
          </div>
          <div>
            <div className="font-semibold text-success">{stats.availableProducts}</div>
            <div className="text-xs text-muted-foreground">In stock</div>
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Updated</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {listings.map((listing) => (
              <TableRow key={listing.id}>
                <TableCell>
                  <Link href={`/products/${listing.product.slug}`} className="font-medium hover:underline">
                    {listing.product.name}
                  </Link>
                </TableCell>
                <TableCell className="font-semibold">{formatBDT(Number(listing.price))}</TableCell>
                <TableCell>
                  <AvailabilityBadge availability={listing.availability} />
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {relativeTimeFromNow(listing.lastCheckedAt)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
