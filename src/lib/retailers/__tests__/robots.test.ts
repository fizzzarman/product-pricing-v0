import { describe, it, expect } from "vitest";
import { parseRobotsTxt, isPathAllowed } from "../robots";

const ROBOTS = `User-agent: *
Disallow: /*?route=
Disallow: /checkout
Allow: /checkout/public$
Crawl-delay: 2

User-agent: BadBot
User-agent: DaamKotoBot
Disallow: /private
`;

describe("parseRobotsTxt", () => {
  it("uses the * group for unknown bots", () => {
    const rules = parseRobotsTxt(ROBOTS, "SomeBot/1.0");
    expect(rules.disallow).toEqual(["/*?route=", "/checkout"]);
    expect(rules.crawlDelaySeconds).toBe(2);
  });

  it("prefers a group naming our bot, including multi-agent groups", () => {
    const rules = parseRobotsTxt(ROBOTS, "DaamKotoBot/1.0 (+https://example.com)");
    expect(rules.disallow).toEqual(["/private"]);
    expect(rules.crawlDelaySeconds).toBeNull();
  });
});

describe("isPathAllowed", () => {
  const rules = parseRobotsTxt(ROBOTS, "SomeBot/1.0");

  it("supports * wildcards", () => {
    expect(isPathAllowed(rules, "/index.php?route=product/search")).toBe(false);
    expect(isPathAllowed(rules, "/laptop-notebook?page=2")).toBe(true);
  });

  it("lets the longest rule win and honors $ anchors", () => {
    expect(isPathAllowed(rules, "/checkout/cart")).toBe(false);
    expect(isPathAllowed(rules, "/checkout/public")).toBe(true);
    expect(isPathAllowed(rules, "/checkout/public/more")).toBe(false);
  });
});
