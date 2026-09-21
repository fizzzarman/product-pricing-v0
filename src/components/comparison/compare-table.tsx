import Link from "next/link";
import Image from "next/image";
import { formatBDT } from "@/lib/pricing/currency";
import type { ProductDetail } from "@/lib/products/detail";

export function CompareTable({ products }: { products: ProductDetail[] }) {
  const specKeys = [...new Set(products.flatMap((p) => Object.keys(p.specifications)))];

  return (
    <>
      {/* Desktop: dense side-by-side table */}
      <div className="hidden overflow-x-auto rounded-lg border md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-secondary/40">
              <th className="w-40 p-3 text-left font-medium text-muted-foreground">&nbsp;</th>
              {products.map((p) => (
                <th key={p.id} className="p-3 text-left min-w-48">
                  <Link href={`/products/${p.slug}`} className="hover:underline">
                    <div className="relative mb-2 aspect-square w-20 bg-muted rounded">
                      {p.imageUrl && (
                        <Image src={p.imageUrl} alt={p.name} fill sizes="80px" className="object-contain p-1.5" />
                      )}
                    </div>
                    <div className="font-semibold leading-snug">{p.name}</div>
                  </Link>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <Row label="Price">
              {products.map((p) => (
                <td key={p.id} className="p-3 font-bold text-primary">
                  {formatBDT(p.priceSummary.lowestAvailablePrice)}
                </td>
              ))}
            </Row>
            <Row label="Available at">
              {products.map((p) => (
                <td key={p.id} className="p-3">
                  {p.priceSummary.availableRetailerCount} / {p.priceSummary.totalRetailerCount} stores
                </td>
              ))}
            </Row>
            <Row label="Brand">
              {products.map((p) => (
                <td key={p.id} className="p-3">{p.brand?.name ?? "—"}</td>
              ))}
            </Row>
            {specKeys.map((key) => (
              <Row key={key} label={key}>
                {products.map((p) => (
                  <td key={p.id} className="p-3">{p.specifications[key] ?? "—"}</td>
                ))}
              </Row>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile: stacked cards, one product at a time */}
      <div className="space-y-6 md:hidden">
        {products.map((p) => (
          <div key={p.id} className="rounded-lg border p-4">
            <Link href={`/products/${p.slug}`} className="flex items-center gap-3 hover:underline">
              <div className="relative size-16 shrink-0 bg-muted rounded">
                {p.imageUrl && <Image src={p.imageUrl} alt={p.name} fill sizes="64px" className="object-contain p-1" />}
              </div>
              <div className="font-semibold">{p.name}</div>
            </Link>
            <div className="mt-3 text-lg font-bold text-primary">
              {formatBDT(p.priceSummary.lowestAvailablePrice)}
            </div>
            <dl className="mt-2 divide-y text-sm">
              <div className="flex justify-between py-1.5">
                <dt className="text-muted-foreground">Available at</dt>
                <dd>{p.priceSummary.availableRetailerCount} / {p.priceSummary.totalRetailerCount} stores</dd>
              </div>
              <div className="flex justify-between py-1.5">
                <dt className="text-muted-foreground">Brand</dt>
                <dd>{p.brand?.name ?? "—"}</dd>
              </div>
              {specKeys.map((key) => (
                <div key={key} className="flex justify-between gap-4 py-1.5">
                  <dt className="text-muted-foreground">{key}</dt>
                  <dd className="text-right">{p.specifications[key] ?? "—"}</dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </div>
    </>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <tr className="border-b last:border-0">
      <td className="p-3 text-muted-foreground font-medium">{label}</td>
      {children}
    </tr>
  );
}
