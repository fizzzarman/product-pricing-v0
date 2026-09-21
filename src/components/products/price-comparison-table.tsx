import Link from "next/link";
import { ExternalLink, AlertTriangle } from "lucide-react";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { AvailabilityBadge } from "@/components/products/availability-badge";
import { formatBDT, priceChangePercent } from "@/lib/pricing/currency";
import { relativeTimeFromNow } from "@/lib/pricing/summary";
import { cn } from "@/lib/utils";
import type { RetailerOffer } from "@/types";

export function PriceComparisonTable({
  offers,
  cheapestAvailableOfferId,
}: {
  offers: RetailerOffer[];
  cheapestAvailableOfferId: string | null;
}) {
  if (offers.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
        No retailers currently list this product.
      </div>
    );
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Retailer</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Stock</TableHead>
            <TableHead>Updated</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {offers.map((offer) => {
            const isCheapest = offer.listingId === cheapestAvailableOfferId;
            const change = priceChangePercent(offer.previousPrice, offer.price);

            return (
              <TableRow key={offer.listingId} className={cn(isCheapest && "bg-success/5")}>
                <TableCell className="font-medium">
                  <Link href={`/retailers/${offer.retailerSlug}`} className="hover:underline">
                    {offer.retailerName}
                  </Link>
                  {isCheapest && (
                    <span className="ml-2 rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-semibold text-success">
                      BEST PRICE
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="font-semibold">{formatBDT(offer.price)}</div>
                  {change !== null && change !== 0 && (
                    <div className={cn("text-xs", change < 0 ? "text-success" : "text-destructive")}>
                      {change > 0 ? "+" : ""}
                      {change}%
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <AvailabilityBadge availability={offer.availability} />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    {offer.isStale && <AlertTriangle className="size-3.5 text-warning" />}
                    {relativeTimeFromNow(offer.lastCheckedAt)}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <Button size="sm" variant="outline" asChild>
                    <a href={offer.externalUrl} target="_blank" rel="noopener noreferrer nofollow">
                      View <ExternalLink className="size-3.5" />
                    </a>
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
