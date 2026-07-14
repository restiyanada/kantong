/**
 * Normalizes an IDR amount string from a bank/e-wallet email into a plain
 * number of rupiah. Handles every format seen across sources:
 *   "13.000"      (Grab, dot as thousands sep, no decimals)     -> 13000
 *   "IDR 5,200.00" (BCA, comma thousands + dot cents)           -> 5200
 *   "Rp.360.000,00" (Danamon, dot thousands + comma cents)      -> 360000
 *   "1950"         (Grab, no separators)                        -> 1950
 *
 * Rule: if the string ends in a separator followed by exactly two digits,
 * that's a cents/decimal group — for IDR receipts these are always ".00" or
 * ",00", so we simply drop them. Any other "." or "," is a thousands
 * separator and gets stripped.
 */
export function normalizeIDRAmount(raw: string): number | null {
  const stripped = raw.replace(/[^\d.,]/g, "");
  if (!stripped) return null;

  const centsMatch = /^(.*)[.,]\d{2}$/.exec(stripped);
  const withoutCents = centsMatch ? centsMatch[1] : stripped;

  const digitsOnly = withoutCents.replace(/[.,]/g, "");
  if (!digitsOnly) return null;

  const value = Number(digitsOnly);
  return Number.isFinite(value) && value > 0 ? value : null;
}
