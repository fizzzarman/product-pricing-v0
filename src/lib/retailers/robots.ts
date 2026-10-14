/**
 * Small robots.txt parser covering what we actually need: is a given path
 * allowed for our user-agent, and is there a Crawl-delay we should respect.
 *
 * Follows the parts of RFC 9309 that matter for a polite crawler:
 *  - consecutive `User-agent` lines form one group;
 *  - the most specific matching group wins (our bot's token over `*`);
 *  - `*` wildcards and a trailing `$` anchor are supported in paths;
 *  - the longest matching rule wins, with Allow winning ties.
 *
 * If robots.txt can't be fetched because of a network error it fails safe
 * (disallow everything) rather than assuming permission (spec §6). A 4xx
 * response conventionally means "no restrictions".
 */

export interface RobotsRules {
  disallow: string[];
  allow: string[];
  crawlDelaySeconds: number | null;
}

interface RobotsGroup extends RobotsRules {
  agents: string[];
}

const cache = new Map<string, { rules: RobotsRules; fetchedAt: number }>();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour — avoid refetching robots.txt on every sync run

/** The product token robots.txt groups are matched against, e.g. "DaamKotoBot/1.0 (+url)" → "daamkotobot". */
function productToken(userAgent: string): string {
  return userAgent.split(/[\s/]/)[0].toLowerCase();
}

export function parseRobotsTxt(body: string, userAgent: string): RobotsRules {
  const groups: RobotsGroup[] = [];
  let current: RobotsGroup | null = null;
  let lastLineWasAgent = false;

  for (const rawLine of body.split(/\r?\n/)) {
    const line = rawLine.split("#")[0].trim();
    if (!line) continue;
    const separator = line.indexOf(":");
    if (separator === -1) continue;
    const key = line.slice(0, separator).trim().toLowerCase();
    const value = line.slice(separator + 1).trim();

    if (key === "user-agent") {
      if (!current || !lastLineWasAgent) {
        current = { agents: [], disallow: [], allow: [], crawlDelaySeconds: null };
        groups.push(current);
      }
      current.agents.push(value.toLowerCase());
      lastLineWasAgent = true;
      continue;
    }

    lastLineWasAgent = false;
    if (!current) continue;

    if (key === "disallow" && value) current.disallow.push(value);
    else if (key === "allow" && value) current.allow.push(value);
    else if (key === "crawl-delay") {
      const seconds = Number(value);
      if (Number.isFinite(seconds)) current.crawlDelaySeconds = seconds;
    }
  }

  const token = productToken(userAgent);
  const specific = groups.filter((g) => g.agents.some((a) => a !== "*" && token.startsWith(a)));
  const applicable = specific.length > 0 ? specific : groups.filter((g) => g.agents.includes("*"));

  return {
    disallow: applicable.flatMap((g) => g.disallow),
    allow: applicable.flatMap((g) => g.allow),
    crawlDelaySeconds: applicable.reduce<number | null>(
      (max, g) => (g.crawlDelaySeconds !== null && (max === null || g.crawlDelaySeconds > max) ? g.crawlDelaySeconds : max),
      null
    ),
  };
}

/** Converts a robots.txt path pattern (with `*` and optional trailing `$`) into an anchored RegExp. */
function patternToRegExp(pattern: string): RegExp {
  const anchored = pattern.endsWith("$");
  const body = (anchored ? pattern.slice(0, -1) : pattern)
    .split("*")
    .map((part) => part.replace(/[.+?^${}()|[\]\\]/g, "\\$&"))
    .join(".*");
  return new RegExp(`^${body}${anchored ? "$" : ""}`);
}

export function isPathAllowed(rules: RobotsRules, path: string): boolean {
  const longestMatch = (patterns: string[]) =>
    patterns.filter((p) => patternToRegExp(p).test(path)).reduce((max, p) => Math.max(max, p.length), -1);

  const disallowLength = longestMatch(rules.disallow);
  if (disallowLength === -1) return true;
  return longestMatch(rules.allow) >= disallowLength;
}

async function fetchRobotsRules(origin: string, userAgent: string): Promise<RobotsRules> {
  const cached = cache.get(origin);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) return cached.rules;

  let rules: RobotsRules;
  try {
    const res = await fetch(`${origin}/robots.txt`, {
      headers: { "User-Agent": userAgent },
      signal: AbortSignal.timeout(8000),
    });
    if (res.status >= 500) {
      // Server error: treat as temporarily disallowed, per RFC 9309 §2.3.1.4.
      rules = { disallow: ["/"], allow: [], crawlDelaySeconds: null };
    } else if (!res.ok) {
      // No robots.txt (4xx) is conventionally treated as "everything allowed".
      rules = { disallow: [], allow: [], crawlDelaySeconds: null };
    } else {
      rules = parseRobotsTxt(await res.text(), userAgent);
    }
  } catch {
    // Network failure fetching robots.txt — fail safe.
    rules = { disallow: ["/"], allow: [], crawlDelaySeconds: null };
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
  return { allowed: isPathAllowed(rules, parsed.pathname + parsed.search), crawlDelaySeconds: rules.crawlDelaySeconds };
}

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
