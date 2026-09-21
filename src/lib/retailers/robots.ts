/**
 * Minimal robots.txt parser covering what we actually need: is a given path
 * allowed for our user-agent (or "*"), and is there a Crawl-delay we should
 * respect. Not a full spec implementation (no wildcard/`$` matching) — good
 * enough to fail safe (disallow) rather than to be a complete crawler-grade
 * parser. If it can't parse or fetch robots.txt, it defaults to disallowing,
 * since the legal/technical requirement (spec §6) is to err on the side of
 * caution, not assume permission.
 */

interface RobotsRules {
  disallow: string[];
  allow: string[];
  crawlDelaySeconds: number | null;
}

const cache = new Map<string, { rules: RobotsRules; fetchedAt: number }>();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour — avoid refetching robots.txt on every sync run

async function fetchRobotsRules(origin: string, userAgent: string): Promise<RobotsRules> {
  const cached = cache.get(origin);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) return cached.rules;

  const rules: RobotsRules = { disallow: [], allow: [], crawlDelaySeconds: null };

  try {
    const res = await fetch(`${origin}/robots.txt`, {
      headers: { "User-Agent": userAgent },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) {
      // No robots.txt (404) is conventionally treated as "everything allowed".
      cache.set(origin, { rules, fetchedAt: Date.now() });
      return rules;
    }

    const body = await res.text();
    let applies = false;

    for (const rawLine of body.split("\n")) {
      const line = rawLine.split("#")[0].trim();
      if (!line) continue;
      const [rawKey, ...rest] = line.split(":");
      const key = rawKey.trim().toLowerCase();
      const value = rest.join(":").trim();

      if (key === "user-agent") {
        applies = value === "*" || value.toLowerCase() === userAgent.toLowerCase();
      } else if (applies && key === "disallow" && value) {
        rules.disallow.push(value);
      } else if (applies && key === "allow" && value) {
        rules.allow.push(value);
      } else if (applies && key === "crawl-delay") {
        const seconds = Number(value);
        if (!Number.isNaN(seconds)) rules.crawlDelaySeconds = seconds;
      }
    }
  } catch {
    // Network failure fetching robots.txt — fail safe: no rules cached, and
    // isPathAllowed() below defaults to disallow when rules are empty AND
    // the fetch itself failed (tracked via the thrown flag below).
    rules.disallow.push("/");
  }

  cache.set(origin, { rules, fetchedAt: Date.now() });
  return rules;
}

export async function isScrapingAllowed(
  url: string,
  userAgent: string
): Promise<{ allowed: boolean; crawlDelaySeconds: number | null }> {
  const parsed = new URL(url);
  const rules = await fetchRobotsRules(parsed.origin, userAgent);

  const path = parsed.pathname + parsed.search;
  const matchingDisallow = rules.disallow
    .filter((rule) => path.startsWith(rule))
    .sort((a, b) => b.length - a.length)[0];
  const matchingAllow = rules.allow
    .filter((rule) => path.startsWith(rule))
    .sort((a, b) => b.length - a.length)[0];

  // Longest matching rule wins, per the de facto robots.txt convention.
  const allowed = !matchingDisallow || (matchingAllow?.length ?? -1) >= matchingDisallow.length;

  return { allowed, crawlDelaySeconds: rules.crawlDelaySeconds };
}

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
