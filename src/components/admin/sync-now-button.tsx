"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SyncNowButton({ retailerSlug }: { retailerSlug: string }) {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState<string | null>(null);

  async function handleSync() {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch(`/api/admin/sync/${retailerSlug}`, { method: "POST" });
      const data = await res.json();
      setResult(res.ok ? `${data.status}: ${data.productsMatched}/${data.productsSeen} matched` : data.error);
      router.refresh();
    } catch {
      setResult("Request failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      {result && <span className="text-xs text-muted-foreground">{result}</span>}
      <Button type="button" size="sm" variant="outline" onClick={handleSync} disabled={loading}>
        <RefreshCw className={loading ? "size-3.5 animate-spin" : "size-3.5"} />
        {loading ? "Syncing..." : "Sync now"}
      </Button>
    </div>
  );
}
