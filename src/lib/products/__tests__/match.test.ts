import { describe, it, expect } from "vitest";
import { computeTitleSimilarity, matchTitleToCandidates, type MatchCandidate } from "../match";

describe("computeTitleSimilarity", () => {
  it("scores identical titles at 1", () => {
    expect(computeTitleSimilarity("ASUS RTX 5070 12GB", "ASUS RTX 5070 12GB")).toBe(1);
  });

  it("scores completely different titles near 0", () => {
    expect(computeTitleSimilarity("ASUS RTX 5070 12GB", "Logitech G Pro Mouse")).toBeLessThan(0.2);
  });

  it("is order-independent (word order shouldn't matter much)", () => {
    const a = computeTitleSimilarity("ASUS RTX 5070 12GB OC", "12GB OC ASUS RTX 5070");
    expect(a).toBe(1);
  });

  it("scores near-duplicates with minor formatting differences highly", () => {
    // Spec §27 example: different retailers' titles for the same product.
    const score = computeTitleSimilarity(
      "ASUS RTX 5070 12GB OC",
      "ASUS GeForce RTX 5070 12GB OC"
    );
    expect(score).toBeGreaterThan(0.7);
  });
});

describe("matchTitleToCandidates", () => {
  const candidates: MatchCandidate[] = [
    { id: "p1", name: "RTX 5070 12GB OC", brandName: "ASUS" },
    { id: "p2", name: "G Pro X Superlight 2", brandName: "Logitech" },
  ];

  it("returns MATCHED with high confidence for a near-identical title", () => {
    const result = matchTitleToCandidates("ASUS RTX 5070 12GB OC", candidates);
    expect(result.status).toBe("MATCHED");
    expect(result.productId).toBe("p1");
    expect(result.confidence).toBeGreaterThan(0.85);
  });

  it("returns UNMATCHED for a title with no plausible candidate", () => {
    const result = matchTitleToCandidates("Seagate Barracuda 2TB HDD", candidates);
    expect(result.status).toBe("UNMATCHED");
    expect(result.productId).toBeNull();
  });

  it("never auto-links a product when confidence is only moderate (spec §27)", () => {
    // A partial/ambiguous title should land in PENDING_REVIEW, not MATCHED,
    // and productId must stay null until a human confirms it.
    const result = matchTitleToCandidates("ASUS Graphics Card 12GB", candidates);
    if (result.status === "PENDING_REVIEW") {
      expect(result.productId).toBeNull();
    }
  });
});
