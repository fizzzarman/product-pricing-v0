import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { AvailabilityBadge } from "@/components/products/availability-badge";
import { prisma } from "@/lib/db/prisma";
import { formatBDT } from "@/lib/pricing/currency";
import { updateProduct, deleteProduct } from "../actions";

interface AdminProductEditPageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminProductEditPage({ params }: AdminProductEditPageProps) {
  const { id } = await params;
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      brand: true,
      category: true,
      listings: { include: { retailer: true }, orderBy: { price: "asc" } },
    },
  });

  if (!product) notFound();

  const updateWithId = updateProduct.bind(null, product.id);
  const deleteWithId = deleteProduct.bind(null, product.id);

  return (
    <div className="max-w-3xl">
      <Link href="/admin/products" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="size-4" /> Back to products
      </Link>

      <h1 className="text-2xl font-bold mb-1">{product.name}</h1>
      <p className="text-sm text-muted-foreground mb-6">
        {product.brand?.name ?? "No brand"} · {product.category.name}
      </p>

      <Card className="p-5">
        <form action={updateWithId} className="space-y-4">
          <Field label="Name">
            <Input name="name" defaultValue={product.name} required />
          </Field>
          <Field label="Model">
            <Input name="model" defaultValue={product.model ?? ""} />
          </Field>
          <Field label="Image URL">
            <Input name="imageUrl" defaultValue={product.imageUrl ?? ""} />
          </Field>
          <Field label="Description">
            <textarea
              name="description"
              defaultValue={product.description ?? ""}
              rows={4}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </Field>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox name="isActive" defaultChecked={product.isActive} />
            Visible on the public site
          </label>

          <div className="flex justify-between pt-2">
            <Button type="submit">Save changes</Button>
          </div>
        </form>

        <form action={deleteWithId} className="mt-2 border-t pt-4">
          <Button type="submit" variant="destructive" size="sm">
            Delete product
          </Button>
        </form>
      </Card>

      <div className="mt-6">
        <h2 className="text-sm font-semibold mb-2">Retailer Listings ({product.listings.length})</h2>
        <div className="rounded-lg border divide-y">
          {product.listings.map((listing) => (
            <div key={listing.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
              <div>
                <div className="font-medium">{listing.retailer.name}</div>
                <div className="text-xs text-muted-foreground">
                  Match confidence: {listing.matchConfidence != null ? `${Math.round(listing.matchConfidence * 100)}%` : "—"} ·{" "}
                  {listing.matchingStatus}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-medium">{formatBDT(Number(listing.price))}</span>
                <AvailabilityBadge availability={listing.availability} />
              </div>
            </div>
          ))}
          {product.listings.length === 0 && (
            <div className="px-4 py-6 text-center text-sm text-muted-foreground">No retailer listings yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}
