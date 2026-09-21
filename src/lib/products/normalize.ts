// Words retailers commonly append that carry no product-identity signal.
const NOISE_WORDS = [
  "brand new",
  "official",
  "genuine",
  "warranty",
  "with warranty",
  "3 years warranty",
  "in bd",
  "bangladesh",
  "price in bangladesh",
  "best price",
];

// Common unit/format inconsistencies across BD retailer sites.
const UNIT_NORMALIZATIONS: Array<[RegExp, string]> = [
  [/(\d+)\s*gb/gi, "$1GB"],
  [/(\d+)\s*tb/gi, "$1TB"],
  [/(\d+)\s*mhz/gi, "$1MHz"],
  [/(\d+)\s*w(?:att)?s?\b/gi, "$1W"],
  [/(\d+)["”]/g, '$1-inch'],
  [/ddr\s*(\d)/gi, "DDR$1"],
  [/rtx\s*-?\s*(\d{4})/gi, "RTX $1"],
  [/gtx\s*-?\s*(\d{4})/gi, "GTX $1"],
  [/rx\s*-?\s*(\d{4})/gi, "RX $1"],
];

/**
 * Normalizes a raw retailer listing title into a comparable canonical form.
 * This does NOT attempt to identify brand/model (see extractSpecs) — it just
 * removes noise and standardizes formatting so downstream fuzzy matching
 * (trigram similarity) has a cleaner input.
 */
export function normalizeTitle(rawTitle: string): string {
  let title = rawTitle.trim().replace(/\s+/g, " ");

  for (const noise of NOISE_WORDS) {
    title = title.replace(new RegExp(noise, "gi"), "");
  }

  for (const [pattern, replacement] of UNIT_NORMALIZATIONS) {
    title = title.replace(pattern, replacement);
  }

  return title.replace(/\s+/g, " ").replace(/[,]+$/g, "").trim();
}

/** Very small keyword-based spec extractor — enough to power search facets and match confidence. */
export function extractSpecsFromTitle(title: string): Record<string, string> {
  const specs: Record<string, string> = {};

  const isGpu = /(RTX|GTX|RX|RADEON|GEFORCE)/i.test(title);
  const vram = isGpu ? title.match(/(\d+)GB/i) : null;
  if (vram) specs.VRAM = `${vram[1]}GB`;

  const ram = title.match(/(\d+)GB\s*(DDR\d)?/i);
  if (ram && /ram|memory/i.test(title)) specs.Capacity = `${ram[1]}GB`;

  const storage = title.match(/(\d+)(GB|TB)\s*(SSD|HDD|NVME|M\.2)/i);
  if (storage) specs.Capacity = `${storage[1]}${storage[2]}`;

  const ddr = title.match(/DDR\d/i);
  if (ddr) specs["Memory Type"] = ddr[0].toUpperCase();

  return specs;
}
