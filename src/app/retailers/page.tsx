import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { Card } from "@/components/ui/card";
import { getAllRetailers } from "@/lib/retailers/queries";
import { relativeTimeFromNow } from "@/lib/pricing/summary";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Retailers",
  description: "Browse all computer hardware retailers tracked on DaamKoto.",
};

export default async function RetailersPage() {
  const retailers = await getAllRetailers();

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-bold">Retailers</h1>
      <p className="text-sm text-muted-foreground mt-1">
        {retailers.length} Bangladeshi computer retailers tracked
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {retailers.map((r) => (
          <Link key={r.id} href={`/retailers/${r.slug}`}>
            <Card className="p-5 transition-shadow hover:shadow-md">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="font-semibold">{r.name}</h2>
                  <a
                    href={r.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                  >
                    {r.websiteUrl.replace(/^https?:\/\//, "")} <ExternalLink className="size-3" />
                  </a>
                </div>
              </div>

              <div className="mt-4 flex gap-6 text-sm">
                <div>
                  <div className="font-semibold">{r.totalProducts}</div>
                  <div className="text-xs text-muted-foreground">Products</div>
                </div>
                <div>
                  <div className="font-semibold text-success">{r.availableProducts}</div>
                  <div className="text-xs text-muted-foreground">In stock</div>
                </div>
                {r.lastUpdated && (
                  <div>
                    <div className="font-semibold">{relativeTimeFromNow(r.lastUpdated)}</div>
                    <div className="text-xs text-muted-foreground">Last updated</div>
                  </div>
                )}
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
