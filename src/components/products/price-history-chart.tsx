"use client";

import * as React from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { formatBDT, formatBDTCompact } from "@/lib/pricing/currency";

interface PricePoint {
  date: string;
  price: number;
}

const RANGES = [
  { value: "7d", label: "7D" },
  { value: "30d", label: "30D" },
  { value: "3m", label: "3M" },
  { value: "6m", label: "6M" },
  { value: "1y", label: "1Y" },
];

export function PriceHistoryChart({ productSlug, initialPoints }: { productSlug: string; initialPoints: PricePoint[] }) {
  const [range, setRange] = React.useState("30d");
  const [points, setPoints] = React.useState<PricePoint[]>(initialPoints);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (range === "30d") {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reuse already-fetched initial data instead of refetching
      setPoints(initialPoints);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetch(`/api/products/${productSlug}/price-history?range=${range}`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setPoints(data.points ?? []);
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [range, productSlug, initialPoints]);

  if (initialPoints.length < 2) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
        Not enough price history yet — check back after a few price checks.
      </div>
    );
  }

  return (
    <div>
      <Tabs value={range} onValueChange={setRange}>
        <TabsList>
          {RANGES.map((r) => (
            <TabsTrigger key={r.value} value={r.value}>
              {r.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="mt-4 h-64">
        {loading ? (
          <Skeleton className="h-full w-full" />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={points} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11 }}
                tickFormatter={(d: string) => new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                minTickGap={30}
              />
              <YAxis
                tick={{ fontSize: 11 }}
                tickFormatter={(v: number) => formatBDTCompact(v)}
                width={56}
                domain={["dataMin - 1000", "dataMax + 1000"]}
              />
              <Tooltip
                formatter={(value) => [formatBDT(Number(value)), "Price"]}
                labelFormatter={(label) =>
                  new Date(String(label)).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
                }
                contentStyle={{ fontSize: 12, borderRadius: 8 }}
              />
              <Line type="monotone" dataKey="price" stroke="var(--color-primary)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
