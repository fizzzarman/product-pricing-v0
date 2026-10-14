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
