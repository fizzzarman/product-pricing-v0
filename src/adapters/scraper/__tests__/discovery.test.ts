import { describe, it, expect } from "vitest";
import * as cheerio from "cheerio";
import { extractCategoryLinks } from "../parse";

const MENU = `
<nav id="main-nav"><ul>
  <li><a href="https://www.startech.com.bd/component">Component</a>
    <ul>
      <li><a href="/component/processor">Processor</a></li>
      <li><a href="/component/graphics-card">Graphics Card</a></li>
      <li><a href="/component/graphics-card">Show All Graphics Card</a></li>
    </ul>
  </li>
  <li><a href="/laptop-notebook">Laptop</a>
    <ul>
      <li><a href="/laptop-notebook/laptop">All Laptop</a>
        <ul><li><a href="/laptop-notebook/laptop/asus">Asus</a></li></ul>
      </li>
    </ul>
  </li>
  <li><a href="/ups">UPS</a></li>
  <li><a href="/information/about">About</a></li>
  <li><a href="https://facebook.com/startech">Facebook</a></li>
  <li><a href="#">Menu</a></li>
</ul></nav>`;

const base = "https://www.startech.com.bd";
const config = { linkSelector: "#main-nav a[href]", exclude: ["^/information"] };

describe("extractCategoryLinks", () => {
  it("keeps the most specific same-site categories, with their parent trail", () => {
    const links = extractCategoryLinks(cheerio.load(MENU), base, config);
    expect(links).toEqual([
      { url: `${base}/component/processor`, name: "Processor", trail: ["Component"] },
      { url: `${base}/component/graphics-card`, name: "Graphics Card", trail: ["Component"] },
      { url: `${base}/laptop-notebook/laptop/asus`, name: "Asus", trail: ["Laptop", "All Laptop"] },
      { url: `${base}/ups`, name: "UPS", trail: [] },
    ]);
  });

  it("can keep top-level categories only", () => {
    const links = extractCategoryLinks(cheerio.load(MENU), base, { ...config, level: "top" });
    expect(links.map((l) => l.name)).toEqual(["Component", "Laptop", "UPS"]);
  });
});

// Star Tech's real shape: flat URLs, hierarchy only in the nested menu lists.
const FLAT_MENU = `
<nav id="main-nav"><ul>
  <li><a href="/appliance">Appliance</a>
    <ul>
      <li><a href="/television-startech">TV</a>
        <ul>
          <li><a href="/haier-television">Haier</a></li>
          <li><a href="/4k-tv">4K TV</a></li>
        </ul>
      </li>
      <li><a href="/air-fryer">Air Fryer</a></li>
    </ul>
  </li>
  <li><a href="/ups">UPS</a></li>
</ul></nav>`;

describe("extractCategoryLinks with flat URLs", () => {
  it("takes the hierarchy from the nested menu", () => {
    const links = extractCategoryLinks(cheerio.load(FLAT_MENU), base, { linkSelector: "#main-nav a[href]" });
    expect(links).toEqual([
      { url: `${base}/haier-television`, name: "Haier", trail: ["Appliance", "TV"] },
      { url: `${base}/4k-tv`, name: "4K TV", trail: ["Appliance", "TV"] },
      { url: `${base}/air-fryer`, name: "Air Fryer", trail: ["Appliance"] },
      { url: `${base}/ups`, name: "UPS", trail: [] },
    ]);
  });

  it("maxDepth stops at the second level instead of brand pages", () => {
    const links = extractCategoryLinks(cheerio.load(FLAT_MENU), base, { linkSelector: "#main-nav a[href]", maxDepth: 2 });
    expect(links.map((l) => l.name)).toEqual(["TV", "Air Fryer", "UPS"]);
  });
});
