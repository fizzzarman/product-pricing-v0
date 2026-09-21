"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function SearchBar({
  className,
  placeholder = "Search laptops, GPUs, keyboards, mice...",
  defaultValue = "",
  size = "default",
}: {
  className?: string;
  placeholder?: string;
  defaultValue?: string;
  size?: "default" | "lg";
}) {
  const router = useRouter();
  const [query, setQuery] = React.useState(defaultValue);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
  }

  return (
    <form onSubmit={handleSubmit} className={cn("relative w-full", className)} role="search">
      <Search
        className={cn(
          "absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground",
          size === "lg" ? "size-5" : "size-4"
        )}
      />
      <Input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        aria-label="Search products"
        className={cn(
          "pl-10",
          size === "lg" && "h-12 text-base pl-11 rounded-xl shadow-sm"
        )}
      />
    </form>
  );
}
