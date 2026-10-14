import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { syncRetailer } from "@/lib/retailers/sync";

export const maxDuration = 60;

function isAdminAuthorized(request: NextRequest): boolean {
  const cookie = request.cookies.get("daamkoto_admin")?.value;
  return Boolean(process.env.ADMIN_SECRET) && cookie === process.env.ADMIN_SECRET;
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ retailerSlug: string }> }) {
  if (!isAdminAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { retailerSlug } = await params;
  const retailer = await prisma.retailer.findUnique({ where: { slug: retailerSlug } });
  if (!retailer) {
    return NextResponse.json({ error: "Retailer not found" }, { status: 404 });
  }

  // Leave headroom under maxDuration for the final DB writes.
  const result = await syncRetailer(retailer.id, { timeBudgetMs: 45_000 });
  return NextResponse.json(result);
}
