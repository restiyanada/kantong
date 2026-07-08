/** The YYYY-MM month containing a given YYYY-MM-DD date. */
export function monthOf(dateISO: string): string {
  return dateISO.slice(0, 7);
}

/** Shifts a YYYY-MM month by `delta` months (negative goes back). */
export function shiftMonth(month: string, delta: number): string {
  const [year, m] = month.split("-").map(Number);
  const totalMonths = (year * 12 + (m - 1)) + delta;
  const targetYear = Math.floor(totalMonths / 12);
  const targetMonth = ((totalMonths % 12) + 12) % 12;
  return `${targetYear}-${String(targetMonth + 1).padStart(2, "0")}`;
}

/** "2026-07" -> "July 2026" */
export function formatMonthLabel(month: string): string {
  const [year, m] = month.split("-").map(Number);
  const date = new Date(Date.UTC(year, m - 1, 1));
  return date.toLocaleString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
}
