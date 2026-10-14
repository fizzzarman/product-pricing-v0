import { describe, it, expect } from "vitest";
import { mapToCategorySlug } from "../categoryMapping";

describe("mapToCategorySlug", () => {
  it("maps common retailer category names", () => {
    expect(mapToCategorySlug("Graphics Card")).toBe("gpu");
    expect(mapToCategorySlug("Processor")).toBe("cpu");
    expect(mapToCategorySlug("SSD")).toBe("ssd");
    expect(mapToCategorySlug("Mobile Phone")).toBe("smartphone");
    expect(mapToCategorySlug("Smart Watch")).toBe("smartwatch");
  });

  it("falls back to parent names for brand sub-categories", () => {
    expect(mapToCategorySlug("Asus", ["Laptop & Notebook", "Laptop"])).toBe("laptop");
    expect(mapToCategorySlug("Xiaomi", ["Phones"])).toBe("smartphone");
  });

  it("prefers specific rules over generic ones", () => {
    expect(mapToCategorySlug("Laptop RAM")).toBe("ram");
    expect(mapToCategorySlug("CPU Cooler")).toBe("cpu-cooler");
    expect(mapToCategorySlug("Laptop Bag")).toBeNull();
    expect(mapToCategorySlug("Phone Case")).toBeNull();
  });

  it("returns null for categories we have no equivalent for", () => {
    expect(mapToCategorySlug("UPS", ["Power"])).toBeNull();
  });
});
