import type { RetailerAdapter } from "@/adapters/base/types";
import type { RetailerProduct } from "@/types";
import type { Availability } from "@prisma/client";

/**
 * PLACEHOLDER — real Ryans Computers integration.
 * See src/adapters/startech/index.ts for the legal/technical checklist to
 * follow before implementing. Until then, DataSource rows should use the
 * "mock-ryans" adapterKey.
 */
export class RyansAdapter implements RetailerAdapter {
  readonly key = "ryans";
  readonly retailerName = "Ryans Computers";

  async searchProducts(_query: string): Promise<RetailerProduct[]> {
    throw new Error("RyansAdapter is not implemented yet — use mock-ryans");
  }

  async getProduct(_url: string): Promise<RetailerProduct> {
    throw new Error("RyansAdapter is not implemented yet — use mock-ryans");
  }

  async getProductAvailability(_product: RetailerProduct): Promise<Availability> {
    throw new Error("RyansAdapter is not implemented yet — use mock-ryans");
  }
}
