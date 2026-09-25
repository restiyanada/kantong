/**
 * Formats an integer IDR amount the Indonesian way, matching bank apps:
 * "Rp1.000.000", and "-Rp24.071.324" for negatives. Grouping is done by hand
 * rather than toLocaleString so server and browser always render the same
 * string (no hydration mismatch from differing ICU data).
 */
export function formatIDR(amount: number): string {
  const digits = String(Math.round(Math.abs(amount))).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${amount < 0 ? "-" : ""}Rp${digits}`;
}

/** Placeholder shown instead of a real amount when balances are hidden. */
const MASKED_AMOUNT = "Rp••••••";

/** Formats an amount, or returns the masked placeholder when `hidden` is true. */
export function displayIDR(amount: number, hidden: boolean): string {
  return hidden ? MASKED_AMOUNT : formatIDR(amount);
}

/** Breaks a YYYY-MM-DD date into named parts (day/month/year/weekday) per `options`. */
function dateParts(dateISO: string, options: Intl.DateTimeFormatOptions) {
  const [year, month, day] = dateISO.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  const parts = new Intl.DateTimeFormat("en-US", { ...options, timeZone: "UTC" }).formatToParts(
    date
  );
  return (type: string) => parts.find((p) => p.type === type)!.value;
}

/** Formats a YYYY-MM-DD date as "17 Jan" — used for chart axes/tooltips. */
export function formatShortDate(dateISO: string): string {
  const get = dateParts(dateISO, { day: "numeric", month: "short" });
  return `${get("day")} ${get("month")}`;
}

/** Formats a YYYY-MM-DD date as "17 Jan 2026" (no weekday) — used where space is tight. */
export function formatMediumDate(dateISO: string): string {
  const get = dateParts(dateISO, { day: "numeric", month: "short", year: "numeric" });
  return `${get("day")} ${get("month")} ${get("year")}`;
}

/** Formats a YYYY-MM-DD date as "Sat, 17 Jan 2026". */
export function formatDateWithDay(dateISO: string): string {
  const get = dateParts(dateISO, {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  return `${get("weekday")}, ${get("day")} ${get("month")} ${get("year")}`;
}
