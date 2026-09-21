import type { RetailerAdapter } from "@/adapters/base/types";
import type { RetailerProduct } from "@/types";
import type { Availability } from "@prisma/client";

/**
 * PLACEHOLDER — real TechLand BD integration.
 * See src/adapters/startech/index.ts for the legal/technical checklist to
 * follow before implementing. Until then, DataSource rows should use the
 * "mock-techland" adapterKey.
 */
export class TechLandAdapter implements RetailerAdapter {
  readonly key = "techland";
  readonly retailerName = "TechLand BD";

  async searchProducts(_query: string): Promise<RetailerProduct[]> {
    throw new Error("TechLandAdapter is not implemented yet — use mock-techland");
  }

  async getProduct(_url: string): Promise<RetailerProduct> {
    throw new Error("TechLandAdapter is not implemented yet — use mock-techland");
  }

  async getProductAvailability(_product: RetailerProduct): Promise<Availability> {
    throw new Error("TechLandAdapter is not implemented yet — use mock-techland");
  }
}
