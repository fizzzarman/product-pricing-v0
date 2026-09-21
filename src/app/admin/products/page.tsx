import Link from "next/link";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/db/prisma";
import { formatBDT } from "@/lib/pricing/currency";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const products = await prisma.product.findMany({
    include: { brand: true, category: true },
    orderBy: { updatedAt: "desc" },
    take: 100,
  });

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Products</h1>
        <span className="text-sm text-muted-foreground">{products.length} shown (most recently updated)</span>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Lowest price</TableHead>
              <TableHead>Retailers</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">&nbsp;</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => (
              <TableRow key={product.id}>
                <TableCell className="max-w-64 truncate font-medium">{product.name}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{product.category.name}</TableCell>
                <TableCell>
                  {formatBDT(
                    product.lowestAvailablePrice ? Number(product.lowestAvailablePrice) : null
                  )}
                </TableCell>
                <TableCell className="text-sm">
                  {product.availableRetailerCount}/{product.totalRetailerCount}
                </TableCell>
                <TableCell>
                  <Badge variant={product.isActive ? "success" : "muted"}>
                    {product.isActive ? "Active" : "Hidden"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Link href={`/admin/products/${product.id}`} className="text-sm text-primary hover:underline">
                    Edit
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
