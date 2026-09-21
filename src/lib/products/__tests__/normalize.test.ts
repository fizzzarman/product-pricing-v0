import { describe, it, expect } from "vitest";
import { normalizeTitle, extractSpecsFromTitle } from "../normalize";

describe("normalizeTitle", () => {
  it("standardizes GB/TB casing and spacing", () => {
    expect(normalizeTitle("Kingston 32 gb DDR5 Ram")).toContain("32GB");
  });

  it("standardizes RTX/GTX/RX model number spacing", () => {
    expect(normalizeTitle("ASUS RTX5070 12GB OC")).toContain("RTX 5070");
    expect(normalizeTitle("Sapphire RX-9070XT 16GB")).toContain("RX 9070");
  });

  it("strips retailer noise phrases", () => {
    const result = normalizeTitle("ASUS RTX 5070 12GB OC - Brand New - Official - 3 years warranty");
    expect(result.toLowerCase()).not.toContain("brand new");
    expect(result.toLowerCase()).not.toContain("official");
    expect(result.toLowerCase()).not.toContain("warranty");
  });

  it("collapses repeated whitespace", () => {
    expect(normalizeTitle("ASUS   RTX   5070")).toBe("ASUS RTX 5070");
  });
});

describe("extractSpecsFromTitle", () => {
  it("extracts VRAM for a graphics card title", () => {
    const specs = extractSpecsFromTitle("ASUS GeForce RTX 5070 12GB OC");
    expect(specs.VRAM).toBe("12GB");
  });

  it("extracts storage capacity for an SSD title", () => {
    const specs = extractSpecsFromTitle("Samsung 990 Pro 1TB NVMe SSD");
    expect(specs.Capacity).toBe("1TB");
  });

  it("extracts DDR memory type", () => {
    const specs = extractSpecsFromTitle("Kingston Fury Beast 32GB DDR5 6000MHz");
    expect(specs["Memory Type"]).toBe("DDR5");
  });
});
