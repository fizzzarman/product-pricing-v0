import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  const brands = await prisma.brand.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, slug: true, logoUrl: true, _count: { select: { products: true } } },
  });

  return NextResponse.json({
    brands: brands.map((b) => ({ ...b, productCount: b._count.products, _count: undefined })),
  });
}
