import { normalizeTitle, extractSpecsFromTitle } from "./normalize";
import type { MatchResult } from "@/types";

const MATCH_THRESHOLD = 0.85;
const REVIEW_THRESHOLD = 0.55;

export interface MatchCandidate {
  id: string;
  name: string;
  brandName: string | null;
}

/**
 * Token-based Dice similarity between two normalized titles. Pure/no deps so
 * it's unit-testable and reusable outside a DB context. This is intentionally
 * simple for V1; §8 notes the search layer (and by extension this scorer)
 * can move to Elasticsearch/Meilisearch/Typesense as the catalog grows.
 */
export function computeTitleSimilarity(a: string, b: string): number {
  const tokenize = (s: string) =>
    new Set(
      s
        .toLowerCase()
        .replace(/[^\w\s]/g, " ")
        .split(/\s+/)
        .filter(Boolean)
    );

  const setA = tokenize(a);
  const setB = tokenize(b);
  if (setA.size === 0 || setB.size === 0) return 0;

  let intersection = 0;
  for (const token of setA) {
    if (setB.has(token)) intersection++;
  }

  return (2 * intersection) / (setA.size + setB.size);
}

/**
 * Scores a raw retailer title against a list of existing canonical products
 * and returns the best match with a confidence-based status. Pure function —
 * callers fetch candidates (e.g. via findCandidateProducts) separately.
 */
export function matchTitleToCandidates(rawTitle: string, candidates: MatchCandidate[]): MatchResult {
  const normalizedTitle = normalizeTitle(rawTitle);
  const extractedSpecs = extractSpecsFromTitle(rawTitle);

  let best: { candidate: MatchCandidate; score: number } | null = null;
  for (const candidate of candidates) {
    const compareTarget = candidate.brandName
      ? `${candidate.brandName} ${candidate.name}`
      : candidate.name;
    const score = computeTitleSimilarity(normalizedTitle, compareTarget);
    if (!best || score > best.score) best = { candidate, score };
  }

  const brandMatch = normalizedTitle.match(/^([A-Za-z]+)/);

  if (!best || best.score < REVIEW_THRESHOLD) {
    return {
      status: "UNMATCHED",
      confidence: best?.score ?? 0,
      productId: null,
      normalizedTitle,
      extractedBrand: brandMatch?.[1] ?? null,
      extractedModel: null,
      extractedSpecs,
    };
  }

  return {
    status: best.score >= MATCH_THRESHOLD ? "MATCHED" : "PENDING_REVIEW",
    confidence: best.score,
    productId: best.score >= MATCH_THRESHOLD ? best.candidate.id : null,
    normalizedTitle,
    extractedBrand: brandMatch?.[1] ?? null,
    extractedModel: null,
    extractedSpecs,
  };
}

/**
 * DB-backed candidate lookup using pg_trgm similarity (fast, index-friendly).
 * Narrows the catalog down to plausible candidates before running the more
 * precise token-based scorer above.
 */
export async function findCandidateProducts(rawTitle: string, limit = 5): Promise<MatchCandidate[]> {
  const { prisma } = await import("@/lib/db/prisma");
  const normalized = normalizeTitle(rawTitle);

  const rows = await prisma.$queryRaw<MatchCandidate[]>`
    SELECT p.id, p.name, b.name as "brandName"
    FROM "Product" p
    LEFT JOIN "Brand" b ON b.id = p."brandId"
    WHERE p."isActive" = true
    ORDER BY similarity(p.name, ${normalized}) DESC
    LIMIT ${limit}
  `;

  return rows;
}
