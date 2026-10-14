import { prisma } from "@/lib/db/prisma";
import type { Prisma } from "@/generated/prisma/client";
import { resolveAdapterForDataSource } from "@/adapters/resolve";
import { mapToCategorySlug } from "@/lib/retailers/categoryMapping";
import { slugify } from "@/lib/products/slugify";
import type { CategoryCrawl, SyncConfig } from "@/lib/retailers/sync";

/** Parent for categories created from retailer menus that match none of ours. */
const MORE_CATEGORIES = { slug: "more", name: "More Categories", nameBn: "আরও ক্যাটাগরি" };

/**
 * Returns the id of the category with this slug, creating it (under "More
 * Categories") when a retailer category maps to nothing we already have.
 */
export async function ensureCategory(slug: string, name: string): Promise<string> {
  const existing = await prisma.category.findUnique({ where: { slug }, select: { id: true } });
  if (existing) return existing.id;

  // Upserts on the unique slug run as INSERT ... ON CONFLICT, so a category created
  // in the meantime (another sync, a stale read through the connection pooler) is
  // simply reused instead of failing with a unique-constraint error.
  const parent = await prisma.category.upsert({
    where: { slug: MORE_CATEGORIES.slug },
    update: {},
    create: { ...MORE_CATEGORIES, iconName: "Package", sortOrder: 100 },
    select: { id: true },
  });
  const category = await prisma.category.upsert({
    where: { slug },
    update: {},
    create: { name, slug, parentId: parent.id, iconName: "Package" },
    select: { id: true },
  });
  return category.id;
}

/** Slug for a retailer category: one of ours if the keyword rules match, else one derived from its name. */
export function suggestCategorySlug(name: string, trail: string[]): string {
  return mapToCategorySlug(name, trail) ?? (slugify(name) || "uncategorized");
}

async function loadRetailer(retailerId: string) {
  const retailer = await prisma.retailer.findUnique({ where: { id: retailerId }, include: { dataSource: true } });
  if (!retailer) throw new Error("Retailer not found");
  if (!retailer.dataSource) throw new Error(`${retailer.name} has no data source configured`);
  return { retailer, dataSource: retailer.dataSource };
}

async function saveCategoryUrls(dataSourceId: string, config: SyncConfig, categoryUrls: CategoryCrawl[], extra: Record<string, unknown> = {}) {
  await prisma.dataSource.update({
    where: { id: dataSourceId },
    data: { config: { ...config, ...extra, categoryUrls } as unknown as Prisma.InputJsonValue },
  });
}

export interface CategorySyncResult {
  found: number;
  added: number;
  missing: number;
}

/**
 * Reads every category from the retailer's site menu and merges it into
 * DataSource.config.categoryUrls. New categories are enabled and auto-mapped;
 * categories the admin already curated keep their mapping and on/off state;
 * ones that vanished from the site are kept, flagged and switched off, never
 * silently dropped.
 */
export async function discoverRetailerCategories(retailerId: string): Promise<CategorySyncResult> {
  const { retailer, dataSource } = await loadRetailer(retailerId);
  const adapter = resolveAdapterForDataSource(dataSource, retailer.name);
  if (!adapter.discoverCategories) {
    throw new Error(`The "${adapter.key}" adapter can't discover categories (only live scrape sources can)`);
  }

  const discovered = await adapter.discoverCategories();
  if (discovered.length === 0) {
    throw new Error("No categories found on the site — check categoryDiscovery.linkSelector in the retailer's config");
  }

  const config = (dataSource.config as SyncConfig | null) ?? {};
  const existing = new Map((config.categoryUrls ?? []).map((c) => [c.url, c]));
  const foundUrls = new Set(discovered.map((d) => d.url));

  let added = 0;
  const merged: CategoryCrawl[] = discovered.map((d) => {
    const previous = existing.get(d.url);
    if (previous) {
      const { notFoundOnSite: _dropped, ...rest } = previous; // eslint-disable-line @typescript-eslint/no-unused-vars
      // Re-map with the latest name/parents unless an admin picked the category by hand.
      const categorySlug = previous.mappedBy === "admin" ? previous.categorySlug : suggestCategorySlug(d.name, d.trail);
      return { ...rest, name: d.name, trail: d.trail, categorySlug };
    }
    added++;
    return { url: d.url, name: d.name, trail: d.trail, categorySlug: suggestCategorySlug(d.name, d.trail), enabled: true };
  });

  const missing = [...existing.values()].filter((c) => !foundUrls.has(c.url));
  // Switched off so dead links aren't crawled; the admin can switch them back on.
  merged.push(...missing.map((c) => ({ ...c, notFoundOnSite: true, enabled: false })));

  for (const category of merged) {
    if (category.enabled !== false) await ensureCategory(category.categorySlug, category.name ?? category.categorySlug);
  }

  await saveCategoryUrls(dataSource.id, config, merged, { categoriesSyncedAt: new Date().toISOString() });
  await prisma.adminAuditLog.create({
    data: {
      action: "retailer.categories.sync",
      entity: "Retailer",
      entityId: retailer.id,
      detail: { found: discovered.length, added, missing: missing.length },
    },
  });

  return { found: discovered.length, added, missing: missing.length };
}

export interface CategoryUpdate {
  url: string;
  enabled: boolean;
  categorySlug: string;
}

/** Applies the admin's on/off and mapping choices from the categories page. */
export async function applyRetailerCategoryUpdates(retailerId: string, updates: CategoryUpdate[]): Promise<number> {
  const { retailer, dataSource } = await loadRetailer(retailerId);
  const config = (dataSource.config as SyncConfig | null) ?? {};
  const byUrl = new Map(updates.map((u) => [u.url, u]));

  let changed = 0;
  const next: CategoryCrawl[] = [];
  for (const category of config.categoryUrls ?? []) {
    const update = byUrl.get(category.url);
    if (!update || (update.enabled === (category.enabled !== false) && update.categorySlug === category.categorySlug)) {
      next.push(category);
      continue;
    }
    changed++;
    if (update.enabled) await ensureCategory(update.categorySlug, category.name ?? update.categorySlug);
    const remapped = update.categorySlug !== category.categorySlug;
    next.push({
      ...category,
      enabled: update.enabled,
      categorySlug: update.categorySlug,
      ...(remapped ? { mappedBy: "admin" as const } : {}),
    });
  }

  if (changed > 0) {
    await saveCategoryUrls(dataSource.id, config, next);
    await prisma.adminAuditLog.create({
      data: { action: "retailer.categories.update", entity: "Retailer", entityId: retailer.id, detail: { changed } },
    });
  }
  return changed;
}

export interface CategoryPruneResult {
  removedEntries: number;
  removedCategories: number;
}

/**
 * Drops the entries a category sync flagged as no longer on the site, then
 * deletes auto-created categories (under "More Categories") that hold no
 * products and that no retailer's crawl list points at any more.
 */
export async function pruneMissingCategories(retailerId: string): Promise<CategoryPruneResult> {
  const { retailer, dataSource } = await loadRetailer(retailerId);
  const config = (dataSource.config as SyncConfig | null) ?? {};
  const current = config.categoryUrls ?? [];
  const kept = current.filter((c) => !c.notFoundOnSite);
  if (kept.length !== current.length) await saveCategoryUrls(dataSource.id, config, kept);

  const referenced = new Set<string>();
  for (const source of await prisma.dataSource.findMany({ select: { config: true } })) {
    for (const entry of (source.config as SyncConfig | null)?.categoryUrls ?? []) referenced.add(entry.categorySlug);
  }

  const { count: removedCategories } = await prisma.category.deleteMany({
    where: {
      parent: { slug: MORE_CATEGORIES.slug },
      slug: { notIn: [...referenced] },
      products: { none: {} },
      children: { none: {} },
    },
  });

  const result = { removedEntries: current.length - kept.length, removedCategories };
  await prisma.adminAuditLog.create({
    data: { action: "retailer.categories.prune", entity: "Retailer", entityId: retailer.id, detail: { ...result } },
  });
  return result;
}
