import { addDays, addMonths, daysBetween } from "./telegram/dateUtils";
import type {
  DailyTransactionDecrypted,
  SavingsTransactionDecrypted,
  DepositoCertificateDecrypted,
} from "@/types";

// ---- Daily: running balance chart ----------------------------------------

export interface RunningBalancePoint {
  date: string;
  balance: number;
}

/** Cumulative balance over time, one point per day that has activity. */
export function computeRunningBalance(
  transactions: Pick<DailyTransactionDecrypted, "date" | "type" | "amount">[]
): RunningBalancePoint[] {
  const netByDate = new Map<string, number>();
  for (const t of transactions) {
    const signed = t.type === "income" ? t.amount : -t.amount;
    netByDate.set(t.date, (netByDate.get(t.date) ?? 0) + signed);
  }

  const dates = [...netByDate.keys()].sort();
  let running = 0;
  return dates.map((date) => {
    running += netByDate.get(date)!;
    return { date, balance: running };
  });
}

export type TimeRange = "1W" | "1M" | "3M" | "YTD" | "1Y" | "All";

function cutoffForRange(range: TimeRange, todayISO: string): string | null {
  switch (range) {
    case "1W":
      return addDays(todayISO, -7);
    case "1M":
      return addMonths(todayISO, -1);
    case "3M":
      return addMonths(todayISO, -3);
    case "1Y":
      return addMonths(todayISO, -12);
    case "YTD":
      return `${todayISO.slice(0, 4)}-01-01`;
    case "All":
      return null;
  }
}

/** Restricts any date-stamped series to the selected chart time range. */
export function filterByTimeRange<T extends { date: string }>(
  points: T[],
  range: TimeRange,
  todayISO: string
): T[] {
  const cutoff = cutoffForRange(range, todayISO);
  if (!cutoff) return points;
  return points.filter((p) => p.date >= cutoff);
}

// ---- Daily: category breakdown + monthly totals ---------------------------

export interface CategoryTotal {
  category: string;
  total: number;
}

/** Sums amounts per category for a given month (YYYY-MM). Excludes pending entries. */
export function computeCategoryBreakdown(
  transactions: DailyTransactionDecrypted[],
  month: string,
  type: "expense" | "income" = "expense"
): CategoryTotal[] {
  const totals = new Map<string, number>();
  for (const t of transactions) {
    if (t.pending || t.type !== type || !t.date.startsWith(month)) continue;
    totals.set(t.category, (totals.get(t.category) ?? 0) + t.amount);
  }
  return [...totals.entries()]
    .map(([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total);
}

export interface MonthlyTotals {
  income: number;
  expense: number;
}

/** Income/expense totals for a month (YYYY-MM). Includes pending entries. */
export function computeMonthlyTotals(
  transactions: DailyTransactionDecrypted[],
  month: string
): MonthlyTotals {
  let income = 0;
  let expense = 0;
  for (const t of transactions) {
    if (!t.date.startsWith(month)) continue;
    if (t.type === "income") income += t.amount;
    else expense += t.amount;
  }
  return { income, expense };
}

/** All-time Daily balance (not scoped to a month — this is the running total). */
export function computeDailyBalance(
  transactions: Pick<DailyTransactionDecrypted, "type" | "amount">[]
): number {
  return transactions.reduce(
    (sum, t) => sum + (t.type === "income" ? t.amount : -t.amount),
    0
  );
}

export interface TransactionFilter {
  month?: string; // YYYY-MM
  type?: "all" | "income" | "expense";
  searchText?: string;
}

export function filterDailyTransactions(
  transactions: DailyTransactionDecrypted[],
  filter: TransactionFilter
): DailyTransactionDecrypted[] {
  const search = filter.searchText?.trim().toLowerCase();
  return transactions
    .filter((t) => !filter.month || t.date.startsWith(filter.month))
    .filter((t) => !filter.type || filter.type === "all" || t.type === filter.type)
    .filter((t) => !search || t.note.toLowerCase().includes(search))
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
}

// ---- Savings ---------------------------------------------------------------

/** All-time Savings balance. */
export function computeSavingsBalance(
  transactions: Pick<SavingsTransactionDecrypted, "direction" | "amount">[]
): number {
  return transactions.reduce(
    (sum, t) => sum + (t.direction === "in" ? t.amount : -t.amount),
    0
  );
}

// ---- Deposito ---------------------------------------------------------------

/** Total value of certificates that haven't been closed/withdrawn yet. */
export function computeDepositoTotal(
  certificates: Pick<DepositoCertificateDecrypted, "principal" | "status">[]
): number {
  return certificates
    .filter((c) => c.status !== "closed")
    .reduce((sum, c) => sum + c.principal, 0);
}

export interface DepositoBadge {
  label: string;
  matured: boolean;
}

/** "Xd left" / "Matured" / "Closed" badge for a certificate (PRD 6). */
export function depositoBadge(
  cert: Pick<DepositoCertificateDecrypted, "maturityDate" | "status">,
  todayISO: string
): DepositoBadge {
  if (cert.status === "closed") return { label: "Closed", matured: true };

  const daysLeft = daysBetween(todayISO, cert.maturityDate);
  if (daysLeft <= 0) return { label: "Matured", matured: true };
  return { label: `${daysLeft}d left`, matured: false };
}

// ---- All view ---------------------------------------------------------------

export interface NetWorthBreakdown {
  daily: number;
  savings: number;
  deposito: number;
  total: number;
}

export function computeNetWorth(
  daily: number,
  savings: number,
  deposito: number
): NetWorthBreakdown {
  return { daily, savings, deposito, total: daily + savings + deposito };
}

export interface GoalBalance {
  goal: string;
  balance: number;
}

/** Net balance (in − out) per savings goal, largest first. */
export function computeGoalBreakdown(
  transactions: Pick<SavingsTransactionDecrypted, "goal" | "direction" | "amount">[]
): GoalBalance[] {
  const totals = new Map<string, number>();
  for (const t of transactions) {
    const signed = t.direction === "in" ? t.amount : -t.amount;
    totals.set(t.goal, (totals.get(t.goal) ?? 0) + signed);
  }
  return [...totals.entries()]
    .map(([goal, balance]) => ({ goal, balance }))
    .sort((a, b) => b.balance - a.balance);
}

export interface NetWorthPoint {
  date: string;
  daily: number;
  savings: number;
  deposito: number;
  total: number;
}

export function computeNetWorthOverTime(
  dailyTransactions: Pick<DailyTransactionDecrypted, "date" | "type" | "amount">[],
  savingsTransactions: Pick<SavingsTransactionDecrypted, "date" | "direction" | "amount">[],
  certificates: Pick<
    "openedDate" | "closedDate" | "principal" | "status"
  >[],
  todayISO: string
): NetWorthPoint[] {
  const eventDates = new Set<string>();
  for (const t of dailyTransactions) eventDates.add(t.date);
  for (const t of savingsTransactions) eventDates.add(t.date);
  for (const c of certificates) {
    eventDates.add(c.openedDate);
    if (c.closedDate) eventDates.add(c.closedDate);
  }
  eventDates.add(todayISO);

  const dates = [...eventDates].sort();

  const dailyByDate = new Map<string, number>();
  for (const t of dailyTransactions) {
    const signed = t.type === "income" ? t.amount : -t.amount;
    dailyByDate.set(t.date, (dailyByDate.get(t.date) ?? 0) + signed);
  }

  const savingsByDate = new Map<string, number>();
  for (const t of savingsTransactions) {
    const signed = t.direction === "in" ? t.amount : -t.amount;
    savingsByDate.set(t.date, (savingsByDate.get(t.date) ?? 0) + signed);
  }

  let runningDaily = 0;
  let runningSavings = 0;

  return dates.map((date) => {
    runningDaily += dailyByDate.get(date) ?? 0;
    runningSavings += savingsByDate.get(date) ?? 0;

    const depositoValue = certificates.reduce((sum, c) => {
      const isOpenByThen = c.openedDate <= date;
      const isStillActive = !c.closedDate || c.closedDate >= date;
      return isOpenByThen && isStillActive ? sum + c.principal : sum;
    }, 0);

    return {
      date,
      daily: runningDaily,
      savings: runningSavings,
      deposito: depositoValue,
      total: runningDaily + runningSavings + depositoValue,
    };
  });
}
