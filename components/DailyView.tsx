"use client";

import { useMemo, useState } from "react";
import type { DailyTransactionDecrypted } from "@/types";
import {
  computeDailySpend,
  filterByTimeRange,
  computeCategoryBreakdown,
  computeMonthlyTotals,
  type TimeRange,
} from "@/lib/aggregations";
import { monthOf } from "@/lib/month";
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
}: {
  transactions: DailyTransactionDecrypted[];
  todayISO: string;
}) {
  const [range, setRange] = useState<TimeRange>("1M");
  const [month, setMonth] = useState(monthOf(todayISO));

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

  return (
    <div className="space-y-4 sm:space-y-6">
      <BalanceCard label="Spending this month" balance={monthlyTotals.expense} />

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
              }))}
            />
          )}
        </Panel>
      </div>

      <Panel>
        <h2 className="mb-4 text-sm font-medium text-[#1A1B1E]">Transactions</h2>
        <DailyTransactionList transactions={transactions} month={month} />
      </Panel>
    </div>
  );
}
