"use client";

import { useMemo, useState } from "react";
import { Wallet, PiggyBank, Landmark } from "lucide-react";
import {
  computeDepositoTotal,
  computeMonthChange,
  computeNetWorth,
  computeNetWorthOverTime,
  filterByTimeRange,
  type TimeRange,
} from "@/lib/aggregations";
import { displaySignedIDR } from "@/lib/format";
import { useBalanceVisibility } from "@/lib/balanceVisibility";
import { BalanceCard } from "./BalanceCard";
import { Panel } from "./Panel";
import { TimeRangeTabs } from "./TimeRangeTabs";
import { NetWorthChart, type NetWorthSeriesConfig } from "./NetWorthChart";
import { AllocationList } from "./AllocationList";
import type {
  DailyTransactionDecrypted,
  SavingsTransactionDecrypted,
  DepositoCertificateDecrypted,
} from "@/types";

const POCKET_META = [
  { key: "daily", label: "Daily", color: "#3B6FA0", icon: Wallet },
  { key: "savings", label: "Savings", color: "#8659B5", icon: PiggyBank },
  { key: "deposito", label: "Deposito", color: "#2E8F94", icon: Landmark },
] as const;

const SAVINGS_DEPOSITO_SERIES: NetWorthSeriesConfig[] = [
  { key: "savings", label: "Savings", color: "#8659B5" },
  { key: "deposito", label: "Deposito", color: "#2E8F94" },
];

export function AllView({
  daily,
  savings,
  deposito,
  todayISO,
  onSelectDeposito,
}: {
  daily: DailyTransactionDecrypted[];
  savings: SavingsTransactionDecrypted[];
  deposito: DepositoCertificateDecrypted[];
  todayISO: string;
  onSelectDeposito: () => void;
}) {
  const [range, setRange] = useState<TimeRange>("3M");
  const { hidden } = useBalanceVisibility();

  // All logged income − expenses; computeNetWorth takes out what's parked in Savings/Deposito.
  const dailyFlow = useMemo(
    () => daily.reduce((sum, t) => sum + (t.type === "income" ? t.amount : -t.amount), 0),
    [daily]
  );
  const savingsBalance = useMemo(
    () => savings.reduce((sum, t) => sum + (t.direction === "in" ? t.amount : -t.amount), 0),
    [savings]
  );
  const depositoTotal = useMemo(
    () => computeDepositoTotal(deposito, todayISO),
    [deposito, todayISO]
  );

  const breakdown = computeNetWorth(dailyFlow, savingsBalance, depositoTotal);
  const values: Record<string, number> = {
    daily: breakdown.daily,
    savings: breakdown.savings,
    deposito: breakdown.deposito,
  };

  const trendPoints = useMemo(
    () => computeNetWorthOverTime(daily, savings, deposito, todayISO),
    [daily, savings, deposito, todayISO]
  );
  const chartPoints = useMemo(
    () => filterByTimeRange(trendPoints, range, todayISO),
    [trendPoints, range, todayISO]
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      <BalanceCard
        label="Total net worth"
        balance={breakdown.total}
        caption={`${displaySignedIDR(computeMonthChange(trendPoints, todayISO), hidden)} this month`}
      />

      <Panel>
        <h2 className="mb-5 text-sm font-medium text-[#1A1B1E]">Proportion of net worth</h2>
        <AllocationList
          items={POCKET_META.map((p) => ({
            label: p.label,
            value: values[p.key],
            color: p.color,
            icon: p.icon,
            onClick: p.key === "deposito" ? onSelectDeposito : undefined,
          }))}
        />
      </Panel>

      <Panel>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-medium text-[#1A1B1E]">Savings &amp; Deposito over time</h2>
          <TimeRangeTabs value={range} onChange={setRange} />
        </div>
        <NetWorthChart points={chartPoints} series={SAVINGS_DEPOSITO_SERIES} />
      </Panel>
    </div>
  );
}
