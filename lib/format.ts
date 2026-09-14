/** Formats an integer IDR amount as "Rp1,000,000" (PRD section 6). */
export function formatIDR(amount: number): string {
  return `Rp${amount.toLocaleString("en-US")}`;
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
