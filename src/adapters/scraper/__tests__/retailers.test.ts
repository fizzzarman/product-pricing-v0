import { describe, it, expect } from "vitest";
import { ScraperAdapter } from "../scraperAdapter";
import { LIVE_RETAILER_PRESETS } from "../presets";

function adapterFor(key: string) {
  const preset = LIVE_RETAILER_PRESETS.find((p) => p.key === key)!;
  return new ScraperAdapter({ key: preset.key, retailerName: preset.name, baseUrl: preset.websiteUrl, ...preset.config });
}

// Trimmed from real pages saved with `scrape:check -- <retailer> --save` (Oct 2026).
const RYANS_CARD = `
<div class="cus-col-2 category-single-product mb-2"><div class="card h-100">
  <div class="image-box">
    <a href="https://www.ryans.com/acer-aspire-3-a325-42-v2-amd-ryzen-3-5300u-laptop">
      <img src="https://www.ryans.com/storage/products/small/acer-aspire-3.webp" alt="Acer Aspire 3"></a>
  </div>
  <div class="card-body">
    <span class="card-text grid-view-text"><span class="product-name"><a href="#">Acer Aspire 3 A325-42-V2 AMD Ryzen 3 5300U 8G ...
      <br/><span class="found-text">33.01.002.1139</span></a></span></span>
    <span class="card-text list-view-text"><a href="https://www.ryans.com/acer-aspire-3-a325-42-v2-amd-ryzen-3-5300u-laptop">Acer Aspire 3 A325-42-V2 AMD Ryzen 3 5300U 8GB RAM 256GB SSD 15.6 Inch FHD Display Steel Gray Laptop</a><br/><span class="found-text">33.01.002.1139</span></span>
    <a href="#" class="pr-text cat-sp-text pb-1"> Tk 57,000 </a>
    <form method="POST" action="https://www.ryans.com/add-to-cart-sc"><button>Add to Cart</button></form>
  </div>
</div></div>`;

const RYANS_PRODUCT = `
<h1 itemprop="name"> Acer Aspire 3 A325-42-V2 AMD Ryzen 3 5300U 8GB RAM 256GB SSD 15.6 Inch FHD Display Steel Gray Laptop</h1>
<div class="price details-all-block" itemprop="offers" itemscope itemtype="http://schema.org/Offer">
  <link itemprop="availability" href="https://schema.org/InStock" />
  <meta itemprop="price" content="57000" />
  <div class="price-block"><span class="rp-block"><span class="sp-block">Special Price<br><span class="new-sp-text">Tk 57,000</span></span></span></div>
  <div class="price-block new-reg-price-block"><span class="new-reg-text">Tk 61,850</span><span class="new-emi-text">EMI TK 5,155</span></div>
</div>
<div id="slideshow-items-container">
  <img class="slideshow-items active" src="https://www.ryans.com/storage/products/main/a-1.webp">
  <img class="slideshow-items" src="https://www.ryans.com/storage/products/main/a-2.webp">
</div>
<div class="overview"><h4>Quick Overview</h4><div class="short-desc-attr"><ul>
  <li>Processor Type. - Ryzen 3</li><li>RAM - 8GB</li></ul></div></div>
<div class="specification-table table-responsive">
  <div class="row table-hr-remove" itemprop="description"><div><span class="att-title">Brand</span></div><div><span class="att-value">Acer</span></div></div>
  <div class="row table-hr-remove"><div><span class="att-title">RAM</span></div><div><span class="att-value">8GB</span></div></div>
</div>`;

const DAZZLE_CARD = `
<div data-product-uuid="51c5bff6" class="group relative">
  <a class="block px-2 pt-2" href="/product/oppo-reno16-5g-price-in-bangladesh">
    <img alt="Oppo Reno 16 5G" src="/_next/image?url=https%3A%2F%2Fdazzle.sgp1.cdn.digitaloceanspaces.com%2F2026-10%2Freno16.jpg&amp;w=3840&amp;q=75"/></a>
  <div class="text-left"><a href="/product/oppo-reno16-5g-price-in-bangladesh">
    <h3 class="font-semibold" title="Oppo Reno 16 5G"><span class="hidden sm:inline">Oppo Reno 16 5G</span><span class="inline sm:hidden">Oppo Reno 16 5G</span><span class="text-[#03A000] font-bold"> In Stock </span></h3></a></div>
  <a class="flex items-baseline gap-2" href="/product/oppo-reno16-5g-price-in-bangladesh"><span class="font-bold"><svg></svg>64,990</span><span class="line-through"><svg></svg>69,990</span></a>
</div>`;

describe("Ryans preset", () => {
  const ryans = adapterFor("ryans");

  it("parses listing cards with the full name, sale price and stock", () => {
    const [product] = ryans.parseListingPage(RYANS_CARD);
    expect(product.title).toBe("Acer Aspire 3 A325-42-V2 AMD Ryzen 3 5300U 8GB RAM 256GB SSD 15.6 Inch FHD Display Steel Gray Laptop");
    expect(product.price).toBe(57000);
    expect(product.availability).toBe("IN_STOCK");
    expect(product.url).toBe("https://www.ryans.com/acer-aspire-3-a325-42-v2-amd-ryzen-3-5300u-laptop");
  });

  it("parses the product page: special price, microdata stock, overview, gallery, specs", () => {
    const product = ryans.parseProductPage(RYANS_PRODUCT, "https://www.ryans.com/acer-aspire-3")!;
    expect(product.price).toBe(57000);
    expect(product.availability).toBe("IN_STOCK");
    expect(product.description).toBe("Processor Type. - Ryzen 3 RAM - 8GB");
    expect(product.images).toEqual(["https://www.ryans.com/storage/products/main/a-1.webp", "https://www.ryans.com/storage/products/main/a-2.webp"]);
    expect(product.specifications).toEqual({ Brand: "Acer", RAM: "8GB" });
  });
});

describe("Dazzle preset", () => {
  it("parses the server-rendered Next.js grid", () => {
    const [product] = adapterFor("dazzle").parseListingPage(DAZZLE_CARD);
    expect(product.title).toBe("Oppo Reno 16 5G");
    expect(product.price).toBe(64990);
    expect(product.availability).toBe("IN_STOCK");
    expect(product.url).toBe("https://dazzle.com.bd/product/oppo-reno16-5g-price-in-bangladesh");
    expect(product.imageUrl).toBe("https://dazzle.sgp1.cdn.digitaloceanspaces.com/2026-10/reno16.jpg");
  });
});
