import { describe, it, expect } from "vitest";
import { parsePrice, parseAvailabilityText, parseSchemaAvailability } from "../parse";

describe("parsePrice", () => {
  it("takes the first price when sale and regular prices are side by side", () => {
    expect(parsePrice("৳1,23,500 ৳1,30,000")).toBe(123500);
  });

  it("ignores trailing numbers such as EMI amounts", () => {
    expect(parsePrice("Tk 85,000 (EMI from 7,083)")).toBe(85000);
  });

  it("reads Bengali numerals", () => {
    expect(parsePrice("১,২৫০ টাকা")).toBe(1250);
  });

  it("returns null when there is no positive number", () => {
    expect(parsePrice("Out Of Stock")).toBeNull();
    expect(parsePrice("0")).toBeNull();
    expect(parsePrice(null)).toBeNull();
  });
});

describe("parseAvailabilityText", () => {
  it("maps common stock phrases", () => {
    expect(parseAvailabilityText(" Out Of Stock ")).toBe("OUT_OF_STOCK");
    expect(parseAvailabilityText("Pre Order")).toBe("PRE_ORDER");
    expect(parseAvailabilityText("Up Coming")).toBe("COMING_SOON");
    expect(parseAvailabilityText("Buy Now")).toBe("IN_STOCK");
    expect(parseAvailabilityText("")).toBe("UNKNOWN");
  });
});

describe("parseSchemaAvailability", () => {
  it("maps schema.org ItemAvailability URLs", () => {
    expect(parseSchemaAvailability("https://schema.org/InStock")).toBe("IN_STOCK");
    expect(parseSchemaAvailability("http://schema.org/OutOfStock")).toBe("OUT_OF_STOCK");
    expect(parseSchemaAvailability("PreOrder")).toBe("PRE_ORDER");
    expect(parseSchemaAvailability(undefined)).toBe("UNKNOWN");
  });
});
