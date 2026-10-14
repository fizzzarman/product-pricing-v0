import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { prisma } from "@/lib/db/prisma";
import type { SyncConfig } from "@/lib/retailers/sync";
import { applyCategories, syncCategories } from "./actions";

export const dynamic = "force-dynamic";
// Category discovery fetches robots.txt + the retailer's homepage.
export const maxDuration = 60;

type SearchParams = { found?: string; added?: string; missing?: string; error?: string; applied?: string };

export default async function RetailerCategoriesPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { slug } = await params;
  const notice = await searchParams;

  const retailer = await prisma.retailer.findUnique({ where: { slug }, include: { dataSource: true } });
  if (!retailer) notFound();

  const config = (retailer.dataSource?.config as (SyncConfig & { categoriesSyncedAt?: string }) | null) ?? {};
  const entries = [...(config.categoryUrls ?? [])].sort((a, b) =>
    [...(a.trail ?? []), a.name ?? a.url].join(" › ").localeCompare([...(b.trail ?? []), b.name ?? b.url].join(" › "))
  );
  const enabledCount = entries.filter((e) => e.enabled !== false).length;

  // Only leaf categories hold products, so those are the mapping targets.
  const categories = await prisma.category.findMany({
    select: { id: true, slug: true, name: true, parentId: true, parent: { select: { name: true } } },
    orderBy: { name: "asc" },
  });
  const parentIds = new Set(categories.map((c) => c.parentId).filter(Boolean));
  const options = categories
    .filter((c) => !parentIds.has(c.id))
    .map((c) => ({ slug: c.slug, label: c.parent ? `${c.parent.name} › ${c.name}` : c.name }))
    .sort((a, b) => a.label.localeCompare(b.label));
  const optionSlugs = new Set(options.map((o) => o.slug));

  const sync = syncCategories.bind(null, retailer.id, retailer.slug);
  const apply = applyCategories.bind(null, retailer.id, retailer.slug);

  return (
    <div>
      <Link href="/admin/retailers" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="size-4" /> Back to retailers
      </Link>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{retailer.name} categories</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {entries.length > 0
              ? `${enabledCount} of ${entries.length} categories are crawled on every sync.`
              : "No categories yet. Sync them from the retailer's site."}
            {config.categoriesSyncedAt && ` Last synced ${new Date(config.categoriesSyncedAt).toLocaleString()}.`}
          </p>
        </div>
        <form action={sync}>
          <Button type="submit" size="sm">
            <RefreshCw className="size-3.5" /> Sync categories from site
          </Button>
        </form>
      </div>

      {notice.error && (
        <Card className="mb-4 border-destructive p-3 text-sm text-destructive">Category sync failed: {notice.error}</Card>
      )}
      {notice.found && (
        <Card className="mb-4 p-3 text-sm">
          Found {notice.found} categories on the site — {notice.added} new
          {Number(notice.missing) > 0 && `, ${notice.missing} no longer on the site (kept, flagged below)`}. New categories
          are enabled; review the mapping below and press Apply if you change anything.
        </Card>
      )}
      {notice.applied && <Card className="mb-4 p-3 text-sm">Saved {notice.applied} change(s).</Card>}

      {entries.length > 0 && (
        <form action={apply}>
          <input type="hidden" name="count" value={entries.length} />
          <div className="mb-3 flex flex-wrap gap-2">
            <Button type="submit" size="sm">Apply</Button>
            <Button type="submit" size="sm" variant="outline" name="bulk" value="enable-all">Enable all</Button>
            <Button type="submit" size="sm" variant="outline" name="bulk" value="disable-all">Disable all</Button>
          </div>

          <div className="rounded-lg border divide-y">
            {entries.map((entry, i) => (
              <div key={entry.url} className="flex flex-wrap items-center gap-3 px-4 py-2.5 text-sm">
                <input type="hidden" name={`url:${i}`} value={entry.url} />
                <input
                  type="checkbox"
                  name={`enabled:${i}`}
                  defaultChecked={entry.enabled !== false}
                  aria-label={`Crawl ${entry.name ?? entry.url}`}
                  className="size-4 accent-primary"
                />
                <div className="min-w-0 flex-1">
                  <div className="font-medium">
                    {entry.trail && entry.trail.length > 0 && (
                      <span className="text-muted-foreground">{entry.trail.join(" › ")} › </span>
                    )}
                    {entry.name ?? entry.url}
                    {entry.notFoundOnSite && (
                      <Badge variant="muted" className="ml-2">Not on site anymore</Badge>
                    )}
                  </div>
                  <a href={entry.url} target="_blank" rel="noreferrer" className="block truncate text-xs text-muted-foreground hover:underline">
                    {entry.url}
                  </a>
                </div>
                <select
                  name={`slug:${i}`}
                  defaultValue={entry.categorySlug}
                  aria-label="Our category"
                  className="w-64 rounded-md border border-input bg-background px-2 py-1.5 text-sm"
                >
                  {!optionSlugs.has(entry.categorySlug) && (
                    <option value={entry.categorySlug}>New: {entry.name ?? entry.categorySlug}</option>
                  )}
                  {options.map((option) => (
                    <option key={option.slug} value={option.slug}>{option.label}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </form>
      )}
    </div>
  );
}
