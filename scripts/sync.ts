import "dotenv/config";
import { prisma } from "../src/lib/db/prisma";
import { syncRetailer } from "../src/lib/retailers/sync";

/**
 * Runs a retailer sync from the command line with no serverless time limit —
 * use it for the first full crawl, or schedule it on any always-on machine /
 * GitHub Actions runner when the catalog is too big for /api/cron/sync-all.
 *
 *   npm run sync                 # every active retailer, one after another
 *   npm run sync -- star-tech    # one retailer by slug
 *   SYNC_BUDGET_MINUTES=120 npm run sync
 */
async function main() {
  const slug = process.argv[2];
  const budgetMs = Number(process.env.SYNC_BUDGET_MINUTES ?? 60) * 60_000;

  const retailers = await prisma.retailer.findMany({
    where: { isActive: true, dataSource: { isActive: true }, ...(slug ? { slug } : {}) },
    select: { id: true, name: true },
  });
  if (retailers.length === 0) throw new Error(slug ? `No active retailer with slug "${slug}"` : "No active retailers");

  for (const retailer of retailers) {
    console.log(`Syncing ${retailer.name}...`);
    const result = await syncRetailer(retailer.id, { timeBudgetMs: budgetMs });
    console.log(`  ${result.status}: ${result.productsSeen} seen, ${result.productsMatched} saved, ${result.errorCount} errors`);
    if (result.errorSummary) console.log(result.errorSummary.split("\n").map((l) => `    ${l}`).join("\n"));
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
