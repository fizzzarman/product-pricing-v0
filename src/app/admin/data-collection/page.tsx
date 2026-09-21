import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/db/prisma";
import { relativeTimeFromNow } from "@/lib/pricing/summary";

export const dynamic = "force-dynamic";

const STATUS_VARIANT = {
  SUCCESS: "success",
  RUNNING: "info",
  PARTIAL: "warning",
  FAILED: "destructive",
} as const;

export default async function AdminDataCollectionPage() {
  const runs = await prisma.scraperRun.findMany({
    include: { dataSource: { include: { retailers: { take: 1 } } } },
    orderBy: { startedAt: "desc" },
    take: 50,
  });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Data Collection</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Scraper/ingestion job history across all data sources. All jobs currently run against mock
        adapters — see README for the plan to wire real retailer adapters.
      </p>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Retailer</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Run</TableHead>
              <TableHead>Products</TableHead>
              <TableHead>Errors</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {runs.map((run) => (
              <TableRow key={run.id}>
                <TableCell className="font-medium">
                  {run.dataSource.retailers[0]?.name ?? run.dataSource.name}
                </TableCell>
                <TableCell>
                  <Badge variant={STATUS_VARIANT[run.status]}>{run.status}</Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{relativeTimeFromNow(run.startedAt)}</TableCell>
                <TableCell>{run.productsMatched} / {run.productsSeen}</TableCell>
                <TableCell className={run.errorCount > 0 ? "text-warning font-medium" : "text-muted-foreground"}>
                  {run.errorCount}
                </TableCell>
              </TableRow>
            ))}
            {runs.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-8">
                  No scraper runs recorded yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
