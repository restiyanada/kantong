/**
 * All dates in Kantong are plain YYYY-MM-DD strings (IDR-only, single
 * timezone — Asia/Jakarta — so we don't need to store timezone info per PRD
 * scope). These helpers keep that logic in one place.
 */

const TIMEZONE = "Asia/Jakarta";

/** Returns "today" as YYYY-MM-DD in Asia/Jakarta, regardless of server TZ. */
export function getTodayISO(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const year = parts.find((p) => p.type === "year")!.value;
  const month = parts.find((p) => p.type === "month")!.value;
  const day = parts.find((p) => p.type === "day")!.value;
  return `${year}-${month}-${day}`;
}

/**
 * Resolves a `DD/MM` backdated prefix (PRD 5.5) into a full YYYY-MM-DD date.
 * Assumes the current year, unless that would put the date in the future
 * relative to `todayISO` — in which case it rolls back to the previous
 * year (handles logging early-January entries in late December, etc).
 */
export function resolveBackdatedDate(
  day: number,
  month: number,
  todayISO: string
): string | null {
  if (month < 1 || month > 12) return null;
  if (day < 1 || day > 31) return null;

  const [todayYear] = todayISO.split("-").map(Number);

  const candidate = (year: number) => {
    // Validate day against the actual days-in-month for that year/month.
    const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
    if (day > lastDay) return null;
    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  };

  let result = candidate(todayYear);
  if (result && result > todayISO) {
    result = candidate(todayYear - 1);
  }
  if (!result) {
    // e.g. Feb 30 in the current year AND the previous year — invalid date.
    return null;
  }
  return result;
}

/**
 * Adds `months` to a YYYY-MM-DD date, clamping the day to the last day of
 * the target month when it would otherwise overflow (e.g. Jan 31 + 1 month
 * → Feb 28, not Mar 3). Negative `months` subtracts.
 */
export function addMonths(dateISO: string, months: number): string {
  const [year, month, day] = dateISO.split("-").map(Number);

  const totalMonths = (month - 1) + months;
  const targetYear = year + Math.floor(totalMonths / 12);
  const targetMonth = ((totalMonths % 12) + 12) % 12; // 0-indexed, always positive

  const lastDayOfTargetMonth = new Date(
    Date.UTC(targetYear, targetMonth + 1, 0)
  ).getUTCDate();
  const clampedDay = Math.min(day, lastDayOfTargetMonth);

  return `${targetYear}-${String(targetMonth + 1).padStart(2, "0")}-${String(clampedDay).padStart(2, "0")}`;
}

/** Adds (or subtracts, if negative) whole days to a YYYY-MM-DD date. */
export function addDays(dateISO: string, days: number): string {
  const [year, month, day] = dateISO.split("-").map(Number);
  const ms = Date.UTC(year, month - 1, day) + days * 86_400_000;
  const d = new Date(ms);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

/** Whole days from `fromISO` to `toISO` (positive if `toISO` is later). */
export function daysBetween(fromISO: string, toISO: string): number {
  const [fy, fm, fd] = fromISO.split("-").map(Number);
  const [ty, tm, td] = toISO.split("-").map(Number);
  const fromMs = Date.UTC(fy, fm - 1, fd);
  const toMs = Date.UTC(ty, tm - 1, td);
  return Math.round((toMs - fromMs) / 86_400_000);
}
