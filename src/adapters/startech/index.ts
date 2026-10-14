import type { RetailerAdapter } from "@/adapters/base/types";
import type { RetailerProduct } from "@/types";
import type { Availability } from "@/generated/prisma/client";

/**
 * PLACEHOLDER — real Star Tech integration.
 *
 * Before implementing this for real, confirm the legal/technical basis
 * (spec §6, §7):
 *   1. Does Star Tech offer an official API, affiliate feed, or merchant
 *      feed? Prefer that over scraping.
 *   2. If scraping is the only option, check robots.txt and Terms of
 *      Service, and keep request rates conservative (see DataSource.config
 *      for a per-source rate-limit knob).
 *   3. Don't run scraping from Vercel serverless functions on a tight
 *      schedule — use the external worker described in spec §21, writing
 *      results back through the same ProductListing upsert path the mock
 *      adapter's data flows through today.
 *
 * Until implemented, DataSource rows should keep using the "mock-startech"
 * adapterKey (see adapters/registry.ts).
 */
export class StarTechAdapter implements RetailerAdapter {
  readonly key = "startech";
  readonly retailerName = "Star Tech";

  async searchProducts(_query: string): Promise<RetailerProduct[]> {
    throw new Error("StarTechAdapter is not implemented yet — use mock-startech");
  }

  async getProduct(_url: string): Promise<RetailerProduct> {
    throw new Error("StarTechAdapter is not implemented yet — use mock-startech");
  }

  async getProductAvailability(_product: RetailerProduct): Promise<Availability> {
    throw new Error("StarTechAdapter is not implemented yet — use mock-startech");
  }
}
