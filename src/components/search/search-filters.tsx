"use client";

import * as React from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface FacetOption {
  slug: string;
  name: string;
}

export function SearchFilters({
  categories,
  brands,
  retailers,
}: {
  categories: FacetOption[];
  brands: FacetOption[];
  retailers: FacetOption[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const activeCategory = searchParams.get("category");
  const activeBrand = searchParams.get("brand");
  const activeRetailer = searchParams.get("retailer");
  const inStockOnly = searchParams.get("inStock") === "1";

  const [minPrice, setMinPrice] = React.useState(searchParams.get("minPrice") ?? "");
  const [maxPrice, setMaxPrice] = React.useState(searchParams.get("maxPrice") ?? "");

  function updateParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === null || value === "") params.delete(key);
    else params.set(key, value);
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }

  function applyPriceRange(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (minPrice) params.set("minPrice", minPrice);
    else params.delete("minPrice");
    if (maxPrice) params.set("maxPrice", maxPrice);
    else params.delete("maxPrice");
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }

  function toggleFacet(key: string, value: string, active: boolean) {
    updateParam(key, active ? null : value);
  }

  const hasActiveFilters = activeCategory || activeBrand || activeRetailer || inStockOnly || minPrice || maxPrice;

  return (
    <aside className="w-full shrink-0 space-y-6 md:w-64">
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground"
          onClick={() => router.push(pathname)}
        >
          Clear all filters
        </Button>
      )}

      <FilterGroup title="Availability">
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <Checkbox
            checked={inStockOnly}
            onCheckedChange={(checked) => updateParam("inStock", checked ? "1" : null)}
          />
          In stock only
        </label>
      </FilterGroup>

      <Separator />

      <FilterGroup title="Category">
        <ul className="space-y-1.5">
          {categories.map((c) => (
            <FacetItem
              key={c.slug}
              label={c.name}
              active={activeCategory === c.slug}
              onClick={() => toggleFacet("category", c.slug, activeCategory === c.slug)}
            />
          ))}
        </ul>
      </FilterGroup>

      <Separator />

      <FilterGroup title="Brand">
        <ul className="max-h-56 space-y-1.5 overflow-y-auto pr-1">
          {brands.map((b) => (
            <FacetItem
              key={b.slug}
              label={b.name}
              active={activeBrand === b.slug}
              onClick={() => toggleFacet("brand", b.slug, activeBrand === b.slug)}
            />
          ))}
        </ul>
      </FilterGroup>

      <Separator />

      <FilterGroup title="Price range (৳)">
        <form onSubmit={applyPriceRange} className="flex items-center gap-2">
          <Input
            type="number"
            placeholder="Min"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            className="h-8"
          />
          <span className="text-muted-foreground">–</span>
          <Input
            type="number"
            placeholder="Max"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            className="h-8"
          />
          <Button type="submit" size="sm" variant="secondary">
            Go
          </Button>
        </form>
      </FilterGroup>

      <Separator />

      <FilterGroup title="Retailer">
        <ul className="space-y-1.5">
          {retailers.map((r) => (
            <FacetItem
              key={r.slug}
              label={r.name}
              active={activeRetailer === r.slug}
              onClick={() => toggleFacet("retailer", r.slug, activeRetailer === r.slug)}
            />
          ))}
        </ul>
      </FilterGroup>
    </aside>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-sm font-semibold mb-2.5">{title}</h3>
      {children}
    </div>
  );
}

function FacetItem({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "w-full rounded-md px-2 py-1 text-left text-sm hover:bg-secondary",
          active && "bg-primary/10 text-primary font-medium"
        )}
      >
        {label}
      </button>
    </li>
  );
}
