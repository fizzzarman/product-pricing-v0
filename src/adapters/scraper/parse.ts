import * as cheerio from "cheerio";
import type { Availability } from "@/generated/prisma/client";

/**
 * Pure HTML/text parsing helpers used by ScraperAdapter. Kept free of network
 * and config concerns so they can be unit-tested against saved HTML fixtures.
 */

const BENGALI_DIGITS = "০১২৩৪৫৬৭৮৯";

/**
 * Parses the first price in a string. Retailer price blocks often contain
 * more than one number ("৳1,23,500 ৳1,30,000" for sale + regular price, or
 * "Tk 85,000 (EMI from 7,083)"), so naively stripping every non-digit glues
 * them into one huge number. Handles BD lakh grouping and Bengali numerals.
 */
export function parsePrice(text: string | null | undefined): number | null {
  if (!text) return null;
  const latin = text.replace(/[০-৯]/g, (d) => String(BENGALI_DIGITS.indexOf(d)));
  const match = latin.match(/\d[\d,]*(?:\.\d+)?/);
  if (!match) return null;
  const value = parseFloat(match[0].replace(/,/g, ""));
  return Number.isFinite(value) && value > 0 ? value : null;
}

export interface AvailabilityKeywords {
  outOfStock: string[];
  lowStock: string[];
  preOrder: string[];
  comingSoon: string[];
}

export const DEFAULT_AVAILABILITY_KEYWORDS: AvailabilityKeywords = {
  outOfStock: ["out of stock", "out-of-stock", "stock out", "sold out", "unavailable", "স্টক নেই"],
  lowStock: ["low stock", "few left", "limited stock", "কম স্টক"],
  preOrder: ["pre-order", "pre order", "preorder", "প্রি-অর্ডার"],
  comingSoon: ["up coming", "upcoming", "coming soon"],
};

/** Maps free-form stock text to an Availability. Empty text means we couldn't tell. */
export function parseAvailabilityText(text: string, keywords: AvailabilityKeywords = DEFAULT_AVAILABILITY_KEYWORDS): Availability {
  const normalized = text.replace(/\s+/g, " ").trim().toLowerCase();
  if (!normalized) return "UNKNOWN";
  if (keywords.outOfStock.some((kw) => normalized.includes(kw))) return "OUT_OF_STOCK";
  if (keywords.preOrder.some((kw) => normalized.includes(kw))) return "PRE_ORDER";
  if (keywords.comingSoon.some((kw) => normalized.includes(kw))) return "COMING_SOON";
  if (keywords.lowStock.some((kw) => normalized.includes(kw))) return "LOW_STOCK";
  return "IN_STOCK";
}

/** schema.org ItemAvailability → our enum. */
export function parseSchemaAvailability(value: unknown): Availability {
  if (typeof value !== "string") return "UNKNOWN";
  const v = value.split("/").pop()!.toLowerCase();
  if (v === "instock" || v === "instoreonly" || v === "onlineonly") return "IN_STOCK";
  if (v === "limitedavailability") return "LOW_STOCK";
  if (v === "preorder" || v === "presale" || v === "backorder") return "PRE_ORDER";
  if (v === "outofstock" || v === "soldout" || v === "discontinued") return "OUT_OF_STOCK";
  return "UNKNOWN";
}

export function absoluteUrl(raw: string | null | undefined, baseUrl: string): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed || trimmed.startsWith("data:")) return null;
  try {
    return new URL(trimmed, baseUrl).toString();
  } catch {
    return null;
  }
}

/**
 * Reads an image URL from an <img>, preferring the configured attribute and
 * then the usual lazy-loading attributes before falling back to `src` (which
 * is often a placeholder GIF on lazy-loaded catalogs).
 */
export function readImageUrl($img: cheerio.Cheerio<any>, baseUrl: string, preferredAttr?: string): string | null { // eslint-disable-line @typescript-eslint/no-explicit-any -- cheerio element type varies by selection
  const candidates = [preferredAttr, "data-src", "data-lazy-src", "data-original", "srcset", "src"].filter(Boolean) as string[];
  for (const attr of candidates) {
    let value = $img.attr(attr);
    if (!value) continue;
    if (attr === "srcset") value = value.split(",")[0].trim().split(/\s+/)[0];
    const url = absoluteUrl(value, baseUrl);
    if (url) return url;
  }
  return null;
}

export function cleanText(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

interface TextishNode {
  type: string;
  data?: string;
  name?: string;
  children?: TextishNode[];
}

/**
 * Like cheerio's .text(), but separates text from different elements with a
 * space — `.text()` turns `<li>2.6 GHz</li><li>12GB</li>` into "2.6 GHz12GB".
 * Skips <script>/<style>. Used for multi-element blocks like descriptions.
 */
export function readableText($selection: cheerio.Cheerio<any>): string { // eslint-disable-line @typescript-eslint/no-explicit-any -- cheerio element type varies by selection
  const parts: string[] = [];
  const walk = (node: TextishNode) => {
    if (node.type === "text" && node.data) parts.push(node.data);
    else if (node.name !== "script" && node.name !== "style") node.children?.forEach(walk);
  };
  $selection.each((_, el) => walk(el as unknown as TextishNode));
  return cleanText(parts.join(" "));
}

export interface JsonLdProduct {
  name: string | null;
  description: string | null;
  url: string | null;
  sku: string | null;
  images: string[];
  price: number | null;
  availability: Availability;
  specifications: Record<string, string>;
}

/** Collects every schema.org Product described in the page's JSON-LD blocks (incl. inside @graph / ItemList). */
export function extractJsonLdProducts($: cheerio.CheerioAPI, baseUrl: string): JsonLdProduct[] {
  const nodes: Record<string, unknown>[] = [];

  const visit = (value: unknown) => {
    if (Array.isArray(value)) return value.forEach(visit);
    if (!value || typeof value !== "object") return;
    const node = value as Record<string, unknown>;
    const type = node["@type"];
    const types = Array.isArray(type) ? type : [type];
    if (types.includes("Product")) nodes.push(node);
    if (node["@graph"]) visit(node["@graph"]);
    if (node.itemListElement) visit(node.itemListElement);
    if (node.item) visit(node.item);
  };

  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      visit(JSON.parse($(el).contents().text()));
    } catch {
      // Malformed JSON-LD is common; ignore the block.
    }
  });

  return nodes.map((node) => {
    const offersRaw = node.offers;
    const offers = (Array.isArray(offersRaw) ? offersRaw[0] : offersRaw) as Record<string, unknown> | undefined;
    const priceValue = offers?.price ?? offers?.lowPrice;

    const imageRaw = node.image;
    const imageList = (Array.isArray(imageRaw) ? imageRaw : imageRaw ? [imageRaw] : [])
      .map((img) => (typeof img === "string" ? img : (img as { url?: string })?.url))
      .map((img) => absoluteUrl(img, baseUrl))
      .filter((img): img is string => Boolean(img));

    const specifications: Record<string, string> = {};
    const props = node.additionalProperty;
    if (Array.isArray(props)) {
      for (const prop of props as Array<{ name?: unknown; value?: unknown }>) {
        if (typeof prop?.name === "string" && prop.value != null) specifications[prop.name] = String(prop.value);
      }
    }

    return {
      name: typeof node.name === "string" ? cleanText(node.name) : null,
      description: typeof node.description === "string" ? cleanText(node.description) : null,
      url: absoluteUrl(typeof node.url === "string" ? node.url : (offers?.url as string | undefined), baseUrl),
      sku: typeof node.sku === "string" ? node.sku : typeof node.sku === "number" ? String(node.sku) : null,
      images: [...new Set(imageList)],
      price: parsePrice(priceValue == null ? null : String(priceValue)),
      availability: parseSchemaAvailability(offers?.availability),
      specifications,
    };
  });
}
