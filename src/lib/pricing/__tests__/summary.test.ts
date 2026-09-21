import { describe, it, expect } from "vitest";
import { computePriceSummary, getFreshness, isStale, relativeTimeFromNow } from "../summary";

describe("computePriceSummary", () => {
  it("returns nulls for a product with no listings", () => {
    const summary = computePriceSummary([]);
    expect(summary.lowestListedPrice).toBeNull();
    expect(summary.lowestAvailablePrice).toBeNull();
    expect(summary.totalRetailerCount).toBe(0);
    expect(summary.availableRetailerCount).toBe(0);
  });

  it("picks the lowest AVAILABLE price, not the lowest listed price, per spec §38", () => {
    // Spec example: ৳100,000 IN_STOCK / ৳95,000 OUT_OF_STOCK / ৳98,000 IN_STOCK
    // -> headline lowest price must be ৳98,000, not ৳95,000.
    const summary = computePriceSummary([
      { price: 100000, availability: "IN_STOCK" },
      { price: 95000, availability: "OUT_OF_STOCK" },
      { price: 98000, availability: "IN_STOCK" },
    ]);

    expect(summary.lowestAvailablePrice).toBe(98000);
    expect(summary.lowestListedPrice).toBe(95000);
  });

  it("treats LOW_STOCK and PRE_ORDER as available", () => {
    const summary = computePriceSummary([
      { price: 50000, availability: "LOW_STOCK" },
      { price: 40000, availability: "PRE_ORDER" },
      { price: 30000, availability: "OUT_OF_STOCK" },
    ]);

    expect(summary.lowestAvailablePrice).toBe(40000);
    expect(summary.availableRetailerCount).toBe(2);
    expect(summary.totalRetailerCount).toBe(3);
  });

  it("returns null lowestAvailablePrice when every listing is out of stock", () => {
    const summary = computePriceSummary([
      { price: 50000, availability: "OUT_OF_STOCK" },
      { price: 55000, availability: "COMING_SOON" },
    ]);

    expect(summary.lowestAvailablePrice).toBeNull();
    expect(summary.lowestListedPrice).toBe(50000);
  });

  it("computes average and highest across all listings regardless of stock", () => {
    const summary = computePriceSummary([
      { price: 100, availability: "IN_STOCK" },
      { price: 200, availability: "OUT_OF_STOCK" },
      { price: 300, availability: "IN_STOCK" },
    ]);

    expect(summary.highestPrice).toBe(300);
    expect(summary.averagePrice).toBe(200);
  });
});

describe("freshness (spec §39)", () => {
  const now = new Date("2026-09-15T12:00:00Z");

  it("is fresh under an hour old", () => {
    const checkedAt = new Date("2026-09-15T11:30:00Z");
    expect(getFreshness(checkedAt, now)).toBe("fresh");
    expect(isStale(checkedAt, now)).toBe(false);
  });

  it("is recent between 1 and 24 hours old", () => {
    const checkedAt = new Date("2026-09-15T05:00:00Z");
    expect(getFreshness(checkedAt, now)).toBe("recent");
    expect(isStale(checkedAt, now)).toBe(false);
  });

  it("is stale at 24+ hours old", () => {
    const checkedAt = new Date("2026-09-13T12:00:00Z");
    expect(getFreshness(checkedAt, now)).toBe("stale");
    expect(isStale(checkedAt, now)).toBe(true);
  });
});

describe("relativeTimeFromNow", () => {
  const now = new Date("2026-09-15T12:00:00Z");

  it("formats minutes, hours, and days correctly", () => {
    expect(relativeTimeFromNow(new Date("2026-09-15T11:50:00Z"), now)).toBe("10 min ago");
    expect(relativeTimeFromNow(new Date("2026-09-15T09:00:00Z"), now)).toBe("3 hrs ago");
    expect(relativeTimeFromNow(new Date("2026-09-13T12:00:00Z"), now)).toBe("2 days ago");
  });
});
