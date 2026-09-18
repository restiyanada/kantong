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

/** Payday — the single source of truth for where a budget cycle starts. */
export const PAYDAY_DAY = 25;

/**
 * Which pay cycle a date belongs to, anchored to `cycleDay` (payday) instead
 * of the calendar month — used only for Budgets, so a paycheck landing
 * mid-month doesn't get split across two calendar-month buckets. Days
 * before `cycleDay` belong to the previous month's cycle; the cycle is
 * labeled like a calendar month (YYYY-MM) for storage/carry-forward, but
 * spans cycleDay of that month through cycleDay-1 of the next.
 */
export function budgetCycleOf(dateISO: string, cycleDay: number): string {
  const [year, month, day] = dateISO.split("-").map(Number);
  const calendarMonth = `${year}-${String(month).padStart(2, "0")}`;
  return day < cycleDay ? shiftMonth(calendarMonth, -1) : calendarMonth;
}
