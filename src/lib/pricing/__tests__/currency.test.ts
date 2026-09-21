import { describe, it, expect } from "vitest";
import { formatBDT, formatBDTCompact, priceChangePercent } from "../currency";

describe("formatBDT", () => {
  it("formats with Bangladesh lakh/crore digit grouping", () => {
    expect(formatBDT(95000)).toBe("৳95,000");
    expect(formatBDT(125000)).toBe("৳1,25,000");
    expect(formatBDT(10000000)).toBe("৳1,00,00,000");
  });

  it("rounds fractional amounts", () => {
    expect(formatBDT(1999.6)).toBe("৳2,000");
  });

  it("returns an em dash for null/undefined/NaN", () => {
    expect(formatBDT(null)).toBe("—");
    expect(formatBDT(undefined)).toBe("—");
    expect(formatBDT(NaN)).toBe("—");
  });
});

describe("formatBDTCompact", () => {
  it("abbreviates lakh and crore amounts", () => {
    expect(formatBDTCompact(150000)).toBe("৳1.5L");
    expect(formatBDTCompact(12000000)).toBe("৳1.2Cr");
    expect(formatBDTCompact(5000)).toBe("৳5k");
  });
});

describe("priceChangePercent", () => {
  it("computes a percentage drop", () => {
    expect(priceChangePercent(100000, 90000)).toBe(-10);
  });

  it("computes a percentage increase", () => {
    expect(priceChangePercent(100000, 110000)).toBe(10);
  });

  it("returns null when there is no previous price", () => {
    expect(priceChangePercent(null, 90000)).toBeNull();
  });
});
