"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import {
  applyRetailerCategoryUpdates,
  discoverRetailerCategories,
  pruneMissingCategories,
  type CategoryUpdate,
} from "@/lib/retailers/categories";

const slugSchema = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

function pagePath(retailerSlug: string) {
  return `/admin/retailers/${retailerSlug}/categories`;
}

/** "Sync categories": re-read the retailer's category menu and merge it into the crawl list. */
export async function syncCategories(retailerId: string, retailerSlug: string) {
  let query: string;
  try {
    const result = await discoverRetailerCategories(retailerId);
    query = `found=${result.found}&added=${result.added}&missing=${result.missing}`;
  } catch (err) {
    query = `error=${encodeURIComponent((err as Error).message)}`;
  }
  revalidatePath(pagePath(retailerSlug));
  redirect(`${pagePath(retailerSlug)}?${query}`);
}

/** "Apply": save the on/off switches and category mappings from the table. */
export async function applyCategories(retailerId: string, retailerSlug: string, formData: FormData) {
  const count = Number(formData.get("count") ?? 0);
  const bulk = formData.get("bulk"); // "enable-all" | "disable-all" | null

  const updates: CategoryUpdate[] = [];
  for (let i = 0; i < count; i++) {
    const url = formData.get(`url:${i}`);
    const slug = slugSchema.safeParse(formData.get(`slug:${i}`));
    if (typeof url !== "string" || !slug.success) continue;
    const enabled = bulk === "enable-all" ? true : bulk === "disable-all" ? false : formData.get(`enabled:${i}`) === "on";
    updates.push({ url, enabled, categorySlug: slug.data });
  }

  const changed = await applyRetailerCategoryUpdates(retailerId, updates);
  revalidatePath(pagePath(retailerSlug));
  redirect(`${pagePath(retailerSlug)}?applied=${changed}`);
}

/** "Remove N no longer on the site": drop flagged entries and empty auto-created categories. */
export async function pruneCategories(retailerId: string, retailerSlug: string) {
  const result = await pruneMissingCategories(retailerId);
  revalidatePath(pagePath(retailerSlug));
  redirect(`${pagePath(retailerSlug)}?pruned=${result.removedEntries}&prunedCategories=${result.removedCategories}`);
}
