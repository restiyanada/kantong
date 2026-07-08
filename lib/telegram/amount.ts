/**
 * Parses a signed amount token, e.g. "25000", "+5000000", "-500000".
 * Used for Daily/Income/Savings amounts. Only plain digit amounts are
 * supported — no "jt"/"rb" shorthand here (that's Deposito-specific, see
 * `parseMagnitude` below), matching the formats shown in PRD section 5.
 */
export function parseSignedAmount(
  token: string
): { sign: "+" | "-" | null; value: number } | null {
  const match = /^([+-])?(\d+)$/.exec(token);
  if (!match) return null;

  const [, sign, digits] = match;
  const value = Number(digits);
  if (!Number.isFinite(value) || value <= 0) return null;

  return { sign: (sign as "+" | "-" | undefined) ?? null, value };
}

/**
 * Parses a magnitude token with optional Indonesian shorthand suffix, as
 * used for Deposito principal amounts (PRD 5.4 example: "20jt"):
 *   "20jt" / "20juta" → 20,000,000
 *   "500rb" / "500ribu" → 500,000
 *   "20000000" → 20,000,000 (plain digits also accepted)
 */
export function parseMagnitude(token: string): number | null {
  const match = /^(\d+)(jt|juta|rb|ribu)?$/i.exec(token);
  if (!match) return null;

  const [, digits, suffix] = match;
  const base = Number(digits);
  if (!Number.isFinite(base) || base <= 0) return null;

  const multiplier = suffix
    ? /^(jt|juta)$/i.test(suffix)
      ? 1_000_000
      : 1_000
    : 1;

  return base * multiplier;
}

/**
 * Parses a Deposito term token, e.g. "6bulan" → 6 (months).
 */
export function parseTermMonths(token: string): number | null {
  const match = /^(\d+)bulan$/i.exec(token);
  if (!match) return null;

  const months = Number(match[1]);
  if (!Number.isFinite(months) || months <= 0) return null;
  return months;
}
