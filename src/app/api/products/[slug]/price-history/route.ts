import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { getProductPriceHistory } from "@/lib/products/detail";

const querySchema = z.object({
  range: z.enum(["7d", "30d", "3m", "6m", "1y"]).default("30d"),
});

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const parsed = querySchema.safeParse({
    range: request.nextUrl.searchParams.get("range") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid range parameter" }, { status: 400 });
  }

  const product = await prisma.product.findUnique({ where: { slug }, select: { id: true } });
  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  const history = await getProductPriceHistory(product.id, parsed.data.range);
  return NextResponse.json({
    range: parsed.data.range,
    points: history.map((h) => ({ date: h.date.toISOString().slice(0, 10), price: h.price })),
  });
}
