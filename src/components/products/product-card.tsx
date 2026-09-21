import Link from "next/link";
import Image from "next/image";
import { Check, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatBDT } from "@/lib/pricing/currency";
import type { ProductCardData } from "@/types";

export function ProductCard({ product }: { product: ProductCardData }) {
  const { priceSummary } = product;
  const outOfStockCount = priceSummary.totalRetailerCount - priceSummary.availableRetailerCount;

  return (
    <Card className="overflow-hidden py-0 gap-0 transition-shadow hover:shadow-md">
      <Link href={`/products/${product.slug}`} className="block">
        <div className="relative aspect-square bg-muted">
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 50vw, 240px"
              className="object-contain p-4"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground text-xs">
              No image
            </div>
          )}
        </div>

        <div className="p-4">
          {product.brandName && (
            <div className="text-xs text-muted-foreground mb-0.5">{product.brandName}</div>
          )}
          <h3 className="font-medium text-sm leading-snug line-clamp-2 min-h-10">{product.name}</h3>

          <div className="mt-2">
            <div className="text-xs text-muted-foreground">From</div>
            <div className="text-lg font-bold text-primary">
              {formatBDT(priceSummary.lowestAvailablePrice ?? priceSummary.lowestListedPrice)}
            </div>
          </div>

          <div className="mt-2 text-xs text-muted-foreground">
            {priceSummary.totalRetailerCount} {priceSummary.totalRetailerCount === 1 ? "store" : "stores"}
          </div>

          <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-xs">
            {priceSummary.availableRetailerCount > 0 && (
              <span className="inline-flex items-center gap-1 text-success">
                <Check className="size-3" /> {priceSummary.availableRetailerCount} in stock
              </span>
            )}
            {outOfStockCount > 0 && (
              <span className="inline-flex items-center gap-1 text-muted-foreground">
                <X className="size-3" /> {outOfStockCount} out of stock
              </span>
            )}
          </div>
        </div>
      </Link>

      <div className="px-4 pb-4">
        <Button asChild size="sm" className="w-full">
          <Link href={`/products/${product.slug}`}>Compare prices</Link>
        </Button>
      </div>
    </Card>
  );
}
