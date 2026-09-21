import { CANONICAL_PRODUCTS } from "./seedData";
import type { MockCatalogEntry } from "./mockAdapter";

function catalogFor(retailerKey: string): MockCatalogEntry[] {
  return CANONICAL_PRODUCTS.filter((p) => p.retailers.includes(retailerKey)).map((p) => ({
    externalId: p.slug,
    title: `${p.name}`,
    basePrice: p.basePrice,
    imageUrl: p.imageUrl,
  }));
}

export const MOCK_STARTECH_CATALOG = catalogFor("mock-startech");
export const MOCK_RYANS_CATALOG = catalogFor("mock-ryans");
export const MOCK_TECHLAND_CATALOG = catalogFor("mock-techland");
export const MOCK_UCC_CATALOG = catalogFor("mock-ucc");
export const MOCK_COMPUTER_SOURCE_CATALOG = catalogFor("mock-computer-source");
