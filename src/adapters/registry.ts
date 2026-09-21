import type { RetailerAdapter } from "@/adapters/base/types";
import { MockRetailerAdapter } from "@/adapters/mock/mockAdapter";
import { MOCK_STARTECH_CATALOG, MOCK_RYANS_CATALOG, MOCK_TECHLAND_CATALOG, MOCK_UCC_CATALOG, MOCK_COMPUTER_SOURCE_CATALOG } from "@/adapters/mock/catalogs";

/**
 * Adding a new retailer to the app is: (1) write an adapter implementing
 * RetailerAdapter, (2) register it here under a stable key, (3) create a
 * DataSource row with that adapterKey. No page, API route, or component
 * needs to change — this is the seam that makes the 6th/50th retailer cheap
 * to add, per the project's core architectural requirement.
 */
const adapters: Record<string, RetailerAdapter> = {
  "mock-startech": new MockRetailerAdapter({
    key: "mock-startech",
    retailerName: "Star Tech",
    baseUrl: "https://www.startech.com.bd",
    priceVarianceFraction: 0.02,
    catalog: MOCK_STARTECH_CATALOG,
  }),
  "mock-ryans": new MockRetailerAdapter({
    key: "mock-ryans",
    retailerName: "Ryans Computers",
    baseUrl: "https://www.ryans.com",
    priceVarianceFraction: 0.035,
    catalog: MOCK_RYANS_CATALOG,
  }),
  "mock-techland": new MockRetailerAdapter({
    key: "mock-techland",
    retailerName: "TechLand BD",
    baseUrl: "https://www.techlandbd.com",
    priceVarianceFraction: 0.03,
    catalog: MOCK_TECHLAND_CATALOG,
  }),
  "mock-ucc": new MockRetailerAdapter({
    key: "mock-ucc",
    retailerName: "UCC",
    baseUrl: "https://www.ucc.com.bd",
    priceVarianceFraction: 0.025,
    catalog: MOCK_UCC_CATALOG,
  }),
  "mock-computer-source": new MockRetailerAdapter({
    key: "mock-computer-source",
    retailerName: "Computer Source",
    baseUrl: "https://www.computersource.com.bd",
    priceVarianceFraction: 0.04,
    catalog: MOCK_COMPUTER_SOURCE_CATALOG,
  }),

  // Real adapters register here once implemented, e.g.:
  // "startech": new StarTechAdapter({ baseUrl: "https://www.startech.com.bd", ... }),
};

export function getAdapter(adapterKey: string): RetailerAdapter {
  const adapter = adapters[adapterKey];
  if (!adapter) throw new Error(`No adapter registered for key "${adapterKey}"`);
  return adapter;
}

export function listAdapterKeys(): string[] {
  return Object.keys(adapters);
}
