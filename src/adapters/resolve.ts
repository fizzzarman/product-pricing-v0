import type { DataSource } from "@/generated/prisma/client";
import type { RetailerAdapter } from "@/adapters/base/types";
import { getAdapter } from "@/adapters/registry";
import { ScraperAdapter, type ScraperAdapterConfig } from "@/adapters/scraper/scraperAdapter";
import { LIVE_RETAILER_PRESETS } from "@/adapters/scraper/presets";

/**
 * Mock and hand-written adapters are looked up by a fixed key in the static
 * registry (adapters/registry.ts). Generic scraped retailers instead carry
 * their entire behavior in DataSource.config as JSON — onboarding retailer
 * #6..#50 is then "add a DataSource row" rather than "write and deploy an
 * adapter class", which is the extensibility goal from the project brief.
 */
export function resolveAdapterForDataSource(dataSource: DataSource, retailerName: string): RetailerAdapter {
  if (dataSource.type !== "PERMITTED_SCRAPE") {
    return getAdapter(dataSource.adapterKey);
  }

  // Built-in retailers (Star Tech, Ryans, Dazzle) take their preset as defaults, so a
  // DataSource row saved by an older `seed:live` still picks up settings added since
  // (e.g. categoryDiscovery). Anything stored in the row overrides the preset.
  const preset = LIVE_RETAILER_PRESETS.find((p) => p.key === dataSource.adapterKey)?.config;
  const stored = (dataSource.config as Partial<ScraperAdapterConfig> | null) ?? {};
  const config = { ...preset, ...stored };
  if (!config.searchSelectors) {
    throw new Error(`DataSource "${dataSource.name}" is type PERMITTED_SCRAPE but is missing searchSelectors in config`);
  }

  return new ScraperAdapter({
    key: dataSource.adapterKey,
    retailerName,
    baseUrl: dataSource.baseUrl ?? "",
    ...config,
  } as ScraperAdapterConfig);
}
