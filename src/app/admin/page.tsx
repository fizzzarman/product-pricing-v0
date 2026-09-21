import Link from "next/link";
import { Card } from "@/components/ui/card";
import { prisma } from "@/lib/db/prisma";
import { relativeTimeFromNow } from "@/lib/pricing/summary";
import { formatBDT } from "@/lib/pricing/currency";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const [productCount, listingCount, retailerCount, recentRuns, recentPriceChanges] = await Promise.all([
    prisma.product.count(),
    prisma.productListing.count(),
    prisma.retailer.count({ where: { isActive: true } }),
    prisma.scraperRun.findMany({
      orderBy: { startedAt: "desc" },
      take: 5,
      include: { dataSource: { include: { retailers: { take: 1 } } } },
    }),
    prisma.productListing.findMany({
      orderBy: { updatedAt: "desc" },
      take: 8,
      include: { product: true, retailer: true },
    }),
  ]);

  const errorCount = recentRuns.reduce((sum, r) => sum + r.errorCount, 0);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Products" value={productCount} href="/admin/products" />
        <StatCard label="Listings" value={listingCount} />
        <StatCard label="Retailers" value={retailerCount} href="/admin/retailers" />
        <StatCard label="Recent Errors" value={errorCount} tone={errorCount > 0 ? "warning" : "default"} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="font-semibold mb-3">Recent Scraper Jobs</h2>
          <ul className="space-y-2 text-sm">
            {recentRuns.map((run) => (
              <li key={run.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                <div>
                  <div className="font-medium">{run.dataSource.retailers[0]?.name ?? run.dataSource.name}</div>
                  <div className="text-xs text-muted-foreground">{relativeTimeFromNow(run.startedAt)}</div>
                </div>
                <div className="text-right text-xs">
                  <div>{run.productsMatched} products</div>
                  <div className={run.errorCount > 0 ? "text-warning" : "text-muted-foreground"}>
                    {run.errorCount} errors
                  </div>
                </div>
              </li>
            ))}
          </ul>
          <Link href="/admin/data-collection" className="mt-3 inline-block text-xs text-primary hover:underline">
            View all data collection jobs →
          </Link>
        </Card>

        <Card className="p-5">
          <h2 className="font-semibold mb-3">Recent Price Updates</h2>
          <ul className="space-y-2 text-sm">
            {recentPriceChanges.map((listing) => (
              <li key={listing.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                <div className="min-w-0">
                  <div className="font-medium truncate">{listing.product.name}</div>
                  <div className="text-xs text-muted-foreground">{listing.retailer.name}</div>
                </div>
                <div className="text-right">
                  <div className="font-medium">{formatBDT(Number(listing.price))}</div>
                  <div className="text-xs text-muted-foreground">{relativeTimeFromNow(listing.updatedAt)}</div>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  href,
  tone = "default",
}: {
  label: string;
  value: number;
  href?: string;
  tone?: "default" | "warning";
}) {
  const content = (
    <Card className="p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`text-2xl font-bold ${tone === "warning" && value > 0 ? "text-warning" : ""}`}>{value}</div>
    </Card>
  );
  return href ? <Link href={href}>{content}</Link> : content;
}
