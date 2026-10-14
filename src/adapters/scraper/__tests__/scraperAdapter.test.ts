import { describe, it, expect } from "vitest";
import { ScraperAdapter } from "../scraperAdapter";
import { LIVE_RETAILER_PRESETS } from "../presets";

const startech = LIVE_RETAILER_PRESETS.find((p) => p.key === "startech")!;
const adapter = new ScraperAdapter({
  key: startech.key,
  retailerName: startech.name,
  baseUrl: startech.websiteUrl,
  ...startech.config,
});

// Trimmed-down copies of Star Tech's listing-card and product-page markup.
const LISTING_HTML = `
<div class="main-content">
  <div class="p-item">
    <div class="p-item-img"><a href="https://www.startech.com.bd/asus-rtx-5070"><img src="https://www.startech.com.bd/image/cache/rtx5070-228x228.webp"></a></div>
    <div class="p-item-details">
      <h4 class="p-item-name"><a href="https://www.startech.com.bd/asus-rtx-5070">ASUS Prime GeForce RTX 5070 12GB</a></h4>
      <div class="p-item-price"><span class="price-new">78,500৳</span> <span class="price-old">82,000৳</span></div>
      <div class="actions"><span class="btn-add-cart">Buy Now</span></div>
    </div>
  </div>
  <div class="p-item">
    <div class="p-item-img"><a href="/msi-b650"><img data-src="/image/cache/b650.webp" src="/catalog/view/theme/loader.gif"></a></div>
    <div class="p-item-details">
      <h4 class="p-item-name"><a href="/msi-b650">MSI PRO B650M-A WiFi</a></h4>
      <div class="p-item-price"><span>Out Of Stock</span></div>
    </div>
  </div>
  <div class="p-item">
    <div class="p-item-details">
      <h4 class="p-item-name"><a href="/corsair-ram">Corsair Vengeance 16GB DDR5</a></h4>
      <div class="p-item-price"><span>6,950৳</span></div>
      <div class="actions"><span>Out of Stock</span></div>
    </div>
  </div>
</div>`;

const PRODUCT_HTML = `
<html><head>
<meta property="og:image" content="https://www.startech.com.bd/image/og.jpg">
<script type="application/ld+json">{"@context":"https://schema.org","@type":"Product","name":"ASUS Prime RTX 5070","sku":"38127",
 "description":"JSON-LD description","image":["https://www.startech.com.bd/image/a.jpg"],
 "offers":{"@type":"Offer","price":"78500","priceCurrency":"BDT","availability":"https://schema.org/InStock"}}</script>
</head><body>
<h1 class="product-name">ASUS Prime GeForce RTX 5070 12GB GDDR7</h1>
<table class="product-info-group"><tr><td class="product-price">78,500৳</td></tr><tr><td class="product-status">In Stock</td></tr></table>
<div class="short-description"><ul><li>Boost clock 2.6 GHz</li><li>12GB GDDR7</li></ul></div>
<div class="product-img-holder"><img src="/image/main.jpg"><img src="/image/side.jpg"></div>
<section id="specification"><table class="data-table">
  <tr><td class="name">Memory Size</td><td class="value">12GB</td></tr>
  <tr><td class="name">Memory Type</td><td class="value">GDDR7</td></tr>
</table></section>
</body></html>`;

describe("ScraperAdapter listing parsing (Star Tech preset)", () => {
  const products = adapter.parseListingPage(LISTING_HTML);

  it("keeps priced items and skips ones without a price", () => {
    expect(products.map((p) => p.title)).toEqual(["ASUS Prime GeForce RTX 5070 12GB", "Corsair Vengeance 16GB DDR5"]);
  });

  it("reads the sale price, absolute URL, image and stock", () => {
    const [gpu, ram] = products;
    expect(gpu.price).toBe(78500);
    expect(gpu.url).toBe("https://www.startech.com.bd/asus-rtx-5070");
    expect(gpu.imageUrl).toBe("https://www.startech.com.bd/image/cache/rtx5070-228x228.webp");
    expect(gpu.availability).toBe("IN_STOCK");
    expect(ram.url).toBe("https://www.startech.com.bd/corsair-ram");
    expect(ram.availability).toBe("OUT_OF_STOCK");
  });
});

describe("ScraperAdapter product page parsing", () => {
  it("collects description, gallery, specs and stock from selectors", () => {
    const product = adapter.parseProductPage(PRODUCT_HTML, "https://www.startech.com.bd/asus-rtx-5070")!;
    expect(product.title).toBe("ASUS Prime GeForce RTX 5070 12GB GDDR7");
    expect(product.price).toBe(78500);
    expect(product.availability).toBe("IN_STOCK");
    expect(product.description).toBe("Boost clock 2.6 GHz 12GB GDDR7");
    expect(product.images).toEqual(["https://www.startech.com.bd/image/main.jpg", "https://www.startech.com.bd/image/side.jpg"]);
    expect(product.specifications).toEqual({ "Memory Size": "12GB", "Memory Type": "GDDR7" });
    expect(product.externalId).toBe("38127");
  });

  it("falls back to JSON-LD when selectors miss", () => {
    const bare = new ScraperAdapter({
      key: "bare",
      retailerName: "Bare",
      baseUrl: "https://example.com",
      searchSelectors: { item: ".x", title: ".x", price: ".x", url: "a" },
    });
    const product = bare.parseProductPage(PRODUCT_HTML, "https://www.startech.com.bd/asus-rtx-5070")!;
    expect(product.title).toBe("ASUS Prime RTX 5070");
    expect(product.price).toBe(78500);
    expect(product.availability).toBe("IN_STOCK");
    expect(product.description).toBe("JSON-LD description");
    expect(product.imageUrl).toBe("https://www.startech.com.bd/image/a.jpg");
  });
});
