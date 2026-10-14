import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SyncNowButton } from "@/components/admin/sync-now-button";
import { prisma } from "@/lib/db/prisma";
import type { SyncConfig } from "@/lib/retailers/sync";
import { toggleRetailerActive } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminRetailersPage() {
  const retailers = await prisma.retailer.findMany({
    include: { dataSource: true, _count: { select: { listings: true } } },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Retailers</h1>

      <div className="space-y-3">
        {retailers.map((retailer) => {
          const toggle = toggleRetailerActive.bind(null, retailer.id, !retailer.isActive);
          const categoryUrls = (retailer.dataSource?.config as SyncConfig | null)?.categoryUrls ?? [];
          const enabledCategories = categoryUrls.filter((c) => c.enabled !== false).length;
          return (
            <Card key={retailer.id} className="flex flex-row items-center justify-between p-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{retailer.name}</span>
                  <Badge variant={retailer.isActive ? "success" : "muted"}>
                    {retailer.isActive ? "Active" : "Disabled"}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {retailer._count.listings} listings · adapter:{" "}
                  <code className="rounded bg-muted px-1 py-0.5">{retailer.dataSource?.adapterKey ?? "—"}</code>
                  {retailer.dataSource?.type === "PERMITTED_SCRAPE" && (
                    <> · {enabledCategories}/{categoryUrls.length} categories crawled</>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                {retailer.dataSource?.type === "PERMITTED_SCRAPE" && (
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/admin/retailers/${retailer.slug}/categories`}>Categories</Link>
                  </Button>
                )}
                <SyncNowButton retailerSlug={retailer.slug} />
                <form action={toggle}>
                  <Button type="submit" size="sm" variant="outline">
                    {retailer.isActive ? "Disable" : "Enable"}
                  </Button>
                </form>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
