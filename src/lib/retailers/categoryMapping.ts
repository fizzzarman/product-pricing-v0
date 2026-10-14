/**
 * Maps a retailer's category names onto our canonical category slugs (see
 * lib/products/categoryTree.ts) with keyword rules. Pure, so it's testable.
 *
 * Rules are checked against the retailer category's own name first, then its
 * parents' names (innermost first) — so Star Tech's "Laptop > Asus" lands in
 * "laptop" even though "Asus" matches nothing. Order matters: more specific
 * rules (cooler, laptop RAM) come before generic ones (laptop, desktop).
 */
interface MappingRule {
  slug: string;
  match: RegExp;
  unless?: RegExp;
}

const RULES: MappingRule[] = [
  { slug: "cpu-cooler", match: /cpu cooler|liquid cool|aio cooler|\bcooler\b/, unless: /laptop cooler|cooling pad|fridge|air cooler/ },
  { slug: "gpu", match: /graphics card|\bgpu\b|\bvga\b/ },
  { slug: "cpu", match: /processor|\bcpu\b/ },
  { slug: "motherboard", match: /motherboard|mainboard/ },
  { slug: "ram", match: /\bram\b/, unless: /\bcam\b|camera/ },
  { slug: "ssd", match: /\bssd\b|solid state/ },
  { slug: "hdd", match: /\bhdd\b|hard dis[ck]/ },
  { slug: "power-supply", match: /power supply|\bpsu\b/ },
  { slug: "pc-case", match: /casing|pc case|chassis/ },
  { slug: "monitor", match: /monitor/, unless: /baby|blood|pressure/ },
  { slug: "webcam", match: /webcam|web cam/ },
  { slug: "microphone", match: /microphone|\bmic\b/ },
  { slug: "keyboard", match: /keyboard/ },
  { slug: "mouse", match: /\bmouse\b/, unless: /pad|mat/ },
  { slug: "headphone", match: /headphone|headset|earphone|earbud|\btws\b|neckband/ },
  { slug: "speakers", match: /speaker|sound ?bar|^sounds?$/ },
  { slug: "router", match: /router/ },
  { slug: "wifi-adapter", match: /wi-?fi adapter|network adapter|lan card|wireless adapter/ },
  { slug: "gaming-accessories", match: /gamepad|controller|joystick|gaming (chair|console|accessor)/ },
  { slug: "tablet", match: /tablet|\bipad\b/, unless: /pen tablet|graphics tablet|drawing/ },
  { slug: "smartwatch", match: /smart ?watch|\bwatch\b/ },
  { slug: "smartphone", match: /smart ?phone|mobile phone|^phones?$|^mobiles?$|iphone/, unless: /accessor|case|cover|holder|stand|charger|cable/ },
  { slug: "laptop", match: /laptop|notebook|macbook|ultrabook/, unless: /bag|backpack|accessor|cooler|stand|battery|adapter|charger|keyboard|skin|sleeve/ },
  { slug: "desktop", match: /desktop|brand pc|all[- ]in[- ]one|mini pc|gaming pc/, unless: /accessor/ },
  { slug: "gadgets", match: /gadget/ },
];

export function mapToCategorySlug(name: string, trail: string[] = []): string | null {
  const labels = [name, ...[...trail].reverse()].map((label) => label.toLowerCase().trim());
  for (const label of labels) {
    for (const rule of RULES) {
      if (rule.match.test(label) && !rule.unless?.test(label)) return rule.slug;
    }
  }
  return null;
}
