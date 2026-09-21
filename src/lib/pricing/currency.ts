/**
 * Bangladesh uses "lakh/crore" digit grouping (e.g. ৳1,25,000 not ৳125,000).
 * Intl's "en-IN" / "bn-BD" locales follow the same 2-2-3 grouping as BDT, so
 * we use it directly rather than hand-rolling the grouping logic.
 */
const BDT_FORMATTER = new Intl.NumberFormat("en-IN", {
  maximumFractionDigits: 0,
});

export function formatBDT(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || Number.isNaN(amount)) return "—";
  return `৳${BDT_FORMATTER.format(Math.round(amount))}`;
}

export function formatBDTCompact(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || Number.isNaN(amount)) return "—";
  if (amount >= 10_000_000) return `৳${(amount / 10_000_000).toFixed(1)}Cr`;
  if (amount >= 100_000) return `৳${(amount / 100_000).toFixed(1)}L`;
  if (amount >= 1_000) return `৳${(amount / 1000).toFixed(0)}k`;
  return formatBDT(amount);
}

/** Percentage change between an old and new price, e.g. for "price dropped 8%" badges. */
export function priceChangePercent(previous: number | null, current: number): number | null {
  if (previous === null || previous === 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}
