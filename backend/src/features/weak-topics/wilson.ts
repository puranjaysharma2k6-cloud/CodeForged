/**
 * Wilson lower-bound score for failure rate.
 *
 * Ranks topics by the lower bound of a confidence interval on failure rate
 * rather than raw failed/total, so a single 1/1 failure doesn't outrank a
 * well-evidenced 40/50 failure rate.
 *
 * Pure function — no DB, no network, fully unit-testable.
 */
export function wilsonLowerBound(
  failures: number,
  total: number,
  z = 1.96,
): number {
  if (total === 0) return 0;
  const p      = failures / total;
  const denom  = 1 + (z * z) / total;
  const centre = p + (z * z) / (2 * total);
  const margin = z * Math.sqrt((p * (1 - p) + (z * z) / (4 * total)) / total);
  return (centre - margin) / denom;
}
