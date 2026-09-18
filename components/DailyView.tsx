"use client";

import { useMemo, useRef, useState } from "react";
import type { DailyTransactionDecrypted } from "@/types";
import {
  computeDailySpend,
  filterByTimeRange,
  computeCategoryBreakdown,
  computeCycleSpendByCategory,
  computeMonthlyTotals,
  type TimeRange,
} from "@/lib/aggregations";
import { monthOf, budgetCycleOf, formatMonthLabel, PAYDAY_DAY } from "@/lib/month";
import { categoryColor } from "@/lib/categoryColors";
import { BalanceCard } from "./BalanceCard";
import { TimeRangeTabs } from "./TimeRangeTabs";
import { DailySpendChart } from "./DailySpendChart";
import { AllocationList } from "./AllocationList";
import { MonthNav } from "./MonthNav";
import { DailyTransactionList } from "./DailyTransactionList";
import { Panel } from "./Panel";

export function DailyView({
  transactions,
  todayISO,
  budgets,
}: {
  transactions: DailyTransactionDecrypted[];
  todayISO: string;
  /** Category -> monthly limit for the current pay cycle. */
  budgets: Record<string, number>;
}) {
  const [range, setRange] = useState<TimeRange>("1M");
  const [month, setMonth] = useState(monthOf(todayISO));
  const [category, setCategory] = useState<string | null>(null);
  const transactionsRef = useRef<HTMLDivElement>(null);

  const dailySpend = useMemo(() => computeDailySpend(transactions), [transactions]);
  const chartPoints = useMemo(
    () => filterByTimeRange(dailySpend, range, todayISO),
    [dailySpend, range, todayISO]
  );
  const monthlyTotals = useMemo(
    () => computeMonthlyTotals(transactions, month),
    [transactions, month]
  );
  const categoryBreakdown = useMemo(
    () => computeCategoryBreakdown(transactions, month, "expense"),
    [transactions, month]
  );

  const cycle = budgetCycleOf(todayISO, PAYDAY_DAY);
  const cycleSpend = useMemo(
    () => computeCycleSpendByCategory(transactions, cycle, PAYDAY_DAY),
    [transactions, cycle]
  );
  const budgetItems = Object.entries(budgets)
    .map(([budgetCategory, limit]) => ({
      label: budgetCategory,
      value: cycleSpend[budgetCategory] ?? 0,
      color: categoryColor(budgetCategory),
      limit,
    }))
    .sort((a, b) => b.value / b.limit - a.value / a.limit);

  return (
    <div className="space-y-4 sm:space-y-6">
      <BalanceCard label="Spending this month" balance={monthlyTotals.expense} />

      {budgetItems.length > 0 && (
        <Panel>
          <h2 className="mb-4 text-sm font-medium text-[#1A1B1E]">
            Budget — cycle since {PAYDAY_DAY} {formatMonthLabel(cycle)}
          </h2>
          <AllocationList items={budgetItems} />
        </Panel>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5 lg:gap-6">
        <Panel className="lg:col-span-3">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-sm font-medium text-[#1A1B1E]">Daily spending</h2>
            <TimeRangeTabs value={range} onChange={setRange} />
          </div>
          <DailySpendChart points={chartPoints} />
        </Panel>

        <Panel className="lg:col-span-2">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-sm font-medium text-[#1A1B1E]">Category breakdown</h2>
            <MonthNav month={month} onChange={setMonth} />
          </div>
          {categoryBreakdown.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center gap-1 text-center">
              <p className="text-sm font-medium text-[#6B6D70]">No expenses this month</p>
              <p className="text-xs text-[#ADAFAF]">
                Categories will appear here once you log some.
              </p>
            </div>
          ) : (
            <AllocationList
              items={categoryBreakdown.map((c) => ({
                label: c.category,
                value: c.total,
                color: categoryColor(c.category),
                onClick: () => {
                  setCategory(c.category);
                  transactionsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                },
              }))}
            />
          )}
        </Panel>
      </div>

      <div ref={transactionsRef}>
        <Panel>
          <h2 className="mb-4 text-sm font-medium text-[#1A1B1E]">Transactions</h2>
          <DailyTransactionList
            transactions={transactions}
            month={month}
            category={category}
            onClearCategory={() => setCategory(null)}
          />
        </Panel>
      </div>
    </div>
  );
}
