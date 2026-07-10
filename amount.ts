"use client";

import { useMemo, useState } from "react";
import type { DailyTransactionDecrypted } from "@/types";
import {
  computeRunningBalance,
  filterByTimeRange,
  computeCategoryBreakdown,
  computeMonthlyTotals,
  computeDailyBalance,
  type TimeRange,
} from "@/lib/aggregations";
import { monthOf } from "@/lib/month";
import { BalanceCard } from "./BalanceCard";
import { TimeRangeTabs } from "./TimeRangeTabs";
import { BalanceChart } from "./BalanceChart";
import { CategoryBars } from "./CategoryBars";
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

  const balance = useMemo(() => computeDailyBalance(transactions), [transactions]);
  const runningBalance = useMemo(() => computeRunningBalance(transactions), [transactions]);
  const chartPoints = useMemo(
    () => filterByTimeRange(runningBalance, range, todayISO),
    [runningBalance, range, todayISO]
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
      <BalanceCard
        label="Daily balance"
        balance={balance}
        stats={[
          { label: "Income this month", value: monthlyTotals.income, tone: "positive" },
          { label: "Expense this month", value: monthlyTotals.expense, tone: "negative" },
        ]}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5 lg:gap-6">
        <Panel className="lg:col-span-3">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-sm font-medium text-[#1A1B1E]">Balance over time</h2>
            <TimeRangeTabs value={range} onChange={setRange} />
          </div>
          <BalanceChart points={chartPoints} />
        </Panel>

        <Panel className="lg:col-span-2">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-sm font-medium text-[#1A1B1E]">Category breakdown</h2>
            <MonthNav month={month} onChange={setMonth} />
          </div>
          <CategoryBars items={categoryBreakdown} />
        </Panel>
      </div>

      <Panel>
        <h2 className="mb-4 text-sm font-medium text-[#1A1B1E]">Transactions</h2>
        <DailyTransactionList transactions={transactions} month={month} />
      </Panel>
    </div>
  );
}
