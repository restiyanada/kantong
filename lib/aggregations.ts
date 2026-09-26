import { addDays, addMonths, daysBetween } from "./telegram/dateUtils";
import { budgetCycleOf } from "./month";
import type {
  DailyTransactionDecrypted,
  SavingsTransactionDecrypted,
  DepositoCertificateDecrypted,
} from "@/types";

// ---- Daily: daily spend chart ----------------------------------------

export interface DailySpendPoint {
  date: string;
  expense: number;
}

/** Total expense per day (income excluded). One point per day with expense activity. */
export function computeDailySpend(
  transactions: Pick<DailyTransactionDecrypted, "date" | "type" | "amount">[]
): DailySpendPoint[] {
  const byDate = new Map<string, number>();
  for (const t of transactions) {
    if (t.type !== "expense") continue;
    byDate.set(t.date, (byDate.get(t.date) ?? 0) + t.amount);
  }
  return [...byDate.entries()]
    .map(([date, expense]) => ({ date, expense }))
    .sort((a, b) => a.date.localeCompare(b.date));
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

/**
 * Expense total per category within a pay cycle (see budgetCycleOf) instead
 * of a calendar month — used only for Budgets, which are set per pay cycle,
 * not per calendar month. Comparing a cycle-scoped limit against a
 * calendar-month total would straddle two different paychecks' spending.
 */
export function computeCycleSpendByCategory(
  transactions: Pick<DailyTransactionDecrypted, "date" | "type" | "amount" | "category" | "pending">[],
  cycle: string,
  cycleDay: number
): Record<string, number> {
  const totals: Record<string, number> = {};
  for (const t of transactions) {
    if (t.pending || t.type !== "expense" || budgetCycleOf(t.date, cycleDay) !== cycle) continue;
    totals[t.category] = (totals[t.category] ?? 0) + t.amount;
  }
  return totals;
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

export interface TransactionFilter {
  month?: string; // YYYY-MM
  type?: "all" | "income" | "expense";
  category?: string;
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
    .filter((t) => !filter.category || t.category === filter.category)
    .filter((t) => !search || t.note.toLowerCase().includes(search))
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
}

export interface DayGroup {
  date: string;
  transactions: DailyTransactionDecrypted[];
}

/**
 * Buckets already-sorted transactions into consecutive same-date groups,
 * preserving the incoming order within and across groups.
 */
export function groupTransactionsByDay(
  transactions: DailyTransactionDecrypted[]
): DayGroup[] {
  const groups: DayGroup[] = [];
  for (const t of transactions) {
    const last = groups[groups.length - 1];
    if (last && last.date === t.date) {
      last.transactions.push(t);
    } else {
      groups.push({ date: t.date, transactions: [t] });
    }
  }
  return groups;
}

/** Slices day groups into a page of `groupsPerPage` complete days (1-indexed page). */
export function paginateDayGroups(
  groups: DayGroup[],
  page: number,
  groupsPerPage: number
): DayGroup[] {
  const start = (page - 1) * groupsPerPage;
  return groups.slice(start, start + groupsPerPage);
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

/**
 * Total value of certificates still locked in a term. A matured certificate
 * stops counting on its maturity date even before it's marked closed — by
 * then the money has either come back out or rolled into a new certificate,
 * which is logged separately.
 */
export function computeDepositoTotal(
  certificates: Pick<DepositoCertificateDecrypted, "principal" | "status" | "maturityDate">[],
  todayISO: string
): number {
  return certificates
    .filter((c) => c.status !== "closed" && c.maturityDate > todayISO)
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
    DepositoCertificateDecrypted,
    "openedDate" | "closedDate" | "maturityDate" | "principal" | "status"
  >[],
  todayISO: string
): NetWorthPoint[] {
  const eventDates = new Set<string>();
  for (const t of dailyTransactions) eventDates.add(t.date);
  for (const t of savingsTransactions) eventDates.add(t.date);
  for (const c of certificates) {
    eventDates.add(c.openedDate);
    if (c.closedDate) eventDates.add(c.closedDate);
    if (c.maturityDate <= todayISO) eventDates.add(c.maturityDate);
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
      const isStillActive =
        (!c.closedDate || c.closedDate >= date) && date < c.maturityDate;
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

/**
 * How much the net-worth total moved since the start of `todayISO`'s month:
 * the latest point minus the last point before the 1st (0 if none).
 */
export function computeMonthChange(
  points: Pick<NetWorthPoint, "date" | "total">[],
  todayISO: string
): number {
  if (points.length === 0) return 0;
  const monthStart = `${todayISO.slice(0, 7)}-01`;
  const before = points.filter((p) => p.date < monthStart);
  const baseline = before.length > 0 ? before[before.length - 1].total : 0;
  return points[points.length - 1].total - baseline;
}
