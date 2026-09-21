import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    select: {
      id: true,
      name: true,
      nameBn: true,
      slug: true,
      parentId: true,
      iconName: true,
      _count: { select: { products: true } },
    },
  });

  return NextResponse.json({
    categories: categories.map((c) => ({ ...c, productCount: c._count.products, _count: undefined })),
  });
}
