/**
 * Normalize a parser diagnostic coordinate value.
 *
 * Ensures that location values (line, column, length) are always
 * valid positive integers, guarding against undefined, NaN, Infinity,
 * and non-positive values from the underlying parser.
 *
 * @param value - The raw numeric value (may be undefined/NaN/Infinity)
 * @param fallback - Value returned when input is invalid (default: 1)
 * @returns A valid positive integer >= 1
 */
export function normalizeLocationValue(
  value: number | undefined,
  fallback = 1,
): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return fallback
  }
  const normalized = Math.floor(value)
  return normalized >= 1 ? normalized : fallback
}
