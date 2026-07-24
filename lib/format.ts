/** Formats an integer IDR amount as "Rp1,000,000" (PRD section 6). */
export function formatIDR(amount: number): string {
  return `Rp${amount.toLocaleString("en-US")}`;
}

/** Placeholder shown instead of a real amount when balances are hidden. */
export const MASKED_AMOUNT = "Rp••••••";

/** Formats an amount, or returns the masked placeholder when `hidden` is true. */
export function displayIDR(amount: number, hidden: boolean): string {
  return hidden ? MASKED_AMOUNT : formatIDR(amount);
}

/** Formats a YYYY-MM-DD date as "17 Jan" — used for chart axes/tooltips. */
export function formatShortDate(dateISO: string): string {
  const [year, month, day] = dateISO.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  const parts = new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).formatToParts(date);

  const get = (type: string) => parts.find((p) => p.type === type)!.value;
  return `${get("day")} ${get("month")}`;
}

/** Formats a YYYY-MM-DD date as "17 Jan 2026" (no weekday) — used where space is tight. */
export function formatMediumDate(dateISO: string): string {
  const [year, month, day] = dateISO.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  const parts = new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).formatToParts(date);

  const get = (type: string) => parts.find((p) => p.type === type)!.value;
  return `${get("day")} ${get("month")} ${get("year")}`;
}

/** Formats a YYYY-MM-DD date as "Sat, 17 Jan 2026". */
export function formatDateWithDay(dateISO: string): string {
  const [year, month, day] = dateISO.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  const parts = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).formatToParts(date);

  const get = (type: string) => parts.find((p) => p.type === type)!.value;
  return `${get("weekday")}, ${get("day")} ${get("month")} ${get("year")}`;
}
