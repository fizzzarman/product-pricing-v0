"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface SearchHit {
  slug: string;
  name: string;
}

const MAX_COMPARE = 4;

export function CompareProductPicker({ currentSlugs }: { currentSlugs: string[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<SearchHit[]>([]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (query.trim().length < 2) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- clear stale results when query no longer qualifies for search
      setResults([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    const timeout = setTimeout(() => {
      fetch(`/api/search?q=${encodeURIComponent(query.trim())}&sort=relevance`)
        .then((res) => res.json())
        .then((data) => {
          if (!cancelled) {
            setResults(
              (data.products ?? [])
                .map((p: { slug: string; name: string }) => ({ slug: p.slug, name: p.name }))
                .filter((p: SearchHit) => !currentSlugs.includes(p.slug))
            );
          }
        })
        .finally(() => !cancelled && setLoading(false));
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [query, currentSlugs]);

  function addProduct(slug: string) {
    if (currentSlugs.length >= MAX_COMPARE) return;
    const next = [...currentSlugs, slug];
    setQuery("");
    setResults([]);
    router.push(`/compare?slugs=${next.join(",")}`);
  }

  function removeProduct(slug: string) {
    const next = currentSlugs.filter((s) => s !== slug);
    const params = new URLSearchParams(searchParams.toString());
    if (next.length > 0) params.set("slugs", next.join(","));
    else params.delete("slugs");
    router.push(`/compare?${params.toString()}`);
  }

  return (
    <div className="space-y-3">
      {currentSlugs.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {currentSlugs.map((slug) => (
            <Badge key={slug} variant="secondary" className="gap-1 pr-1">
              {slug}
              <button onClick={() => removeProduct(slug)} aria-label={`Remove ${slug}`} className="ml-1 rounded-full hover:bg-background/60">
                <X className="size-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {currentSlugs.length < MAX_COMPARE && (
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Add a product to compare..."
            className="pl-9"
          />
          {(results.length > 0 || loading) && (
            <div className="absolute z-10 mt-1 w-full rounded-md border bg-popover shadow-md">
              {loading && <div className="p-2 text-xs text-muted-foreground">Searching...</div>}
              {results.map((r) => (
                <button
                  key={r.slug}
                  onClick={() => addProduct(r.slug)}
                  className="block w-full px-3 py-2 text-left text-sm hover:bg-secondary"
                >
                  {r.name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
