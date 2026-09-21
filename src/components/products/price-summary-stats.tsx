import { Card } from "@/components/ui/card";
import { formatBDT } from "@/lib/pricing/currency";
import type { PriceSummary } from "@/types";

export function PriceSummaryStats({ summary }: { summary: PriceSummary }) {
  const hasAvailable = summary.lowestAvailablePrice !== null;

  return (
    <Card className="p-5">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label="Lowest price" value={formatBDT(summary.lowestAvailablePrice)} highlight />
        <Stat label="Average" value={formatBDT(summary.averagePrice)} />
        <Stat label="Highest" value={formatBDT(summary.highestPrice)} />
        <Stat
          label="Available at"
          value={`${summary.availableRetailerCount} / ${summary.totalRetailerCount} stores`}
        />
      </div>
      {!hasAvailable && summary.totalRetailerCount > 0 && (
        <p className="mt-3 text-xs text-muted-foreground">
          All listed retailers are currently out of stock. Lowest listed price was{" "}
          {formatBDT(summary.lowestListedPrice)}.
        </p>
      )}
    </Card>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={highlight ? "text-xl font-bold text-primary" : "text-lg font-semibold"}>{value}</div>
    </div>
  );
}
