import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { syncRetailer } from "@/lib/retailers/sync";

// Fluid compute (enabled by default on new Vercel projects) lets network-wait
// time count for much less against this budget, so 15 lightweight HTTP+parse
// scrapes running in parallel comfortably fit well under this ceiling in
// practice. Raise toward the 800s Pro/Enterprise ceiling if you add many more
// retailers or slower sites. See README's "Scheduled sync" section.
export const maxDuration = 300;

/**
 * Authenticates either:
 *  - Vercel Cron's own invocation (sends `Authorization: Bearer ${CRON_SECRET}` automatically), or
 *  - A manual/external-scheduler call with the same bearer token, so this
 *    endpoint works unchanged whether you're on Vercel Pro (native cron) or
 *    Hobby (external scheduler hitting this URL) — see README.
 */
function isAuthorized(request: NextRequest): boolean {
  const auth = request.headers.get("authorization");
  return Boolean(process.env.CRON_SECRET) && auth === `Bearer ${process.env.CRON_SECRET}`;
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const retailers = await prisma.retailer.findMany({
    where: { isActive: true, dataSource: { isActive: true } },
    select: { id: true, name: true, slug: true },
  });

  // Promise.allSettled, not Promise.all: one retailer's scraper throwing must
  // never take down the sync for the other 14 (spec §35 error isolation).
  const settled = await Promise.allSettled(retailers.map((r) => syncRetailer(r.id)));

  const results = settled.map((result, i) => ({
    retailer: retailers[i].name,
    ...(result.status === "fulfilled"
      ? result.value
      : { status: "FAILED" as const, productsSeen: 0, productsMatched: 0, errorCount: 1, errorSummary: String(result.reason) }),
  }));

  return NextResponse.json({
    syncedAt: new Date().toISOString(),
    retailerCount: retailers.length,
    results,
  });
}
