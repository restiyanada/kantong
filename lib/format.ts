/** Formats an integer IDR amount as "Rp1,000,000" (PRD section 6). */
export function formatIDR(amount: number): string {
  return `Rp${amount.toLocaleString("en-US")}`;
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
