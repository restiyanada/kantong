"use client";

import { useMemo, useState } from "react";
import { Wallet, PiggyBank, Landmark } from "lucide-react";
import {
  computeNetWorth,
  computeNetWorthOverTime,
  filterByTimeRange,
  type TimeRange,
} from "@/lib/aggregations";
import { formatIDR } from "@/lib/format";
import { BalanceCard } from "./BalanceCard";
import { Panel } from "./Panel";
import { TimeRangeTabs } from "./TimeRangeTabs";
import { NetWorthChart, type NetWorthSeriesConfig } from "./NetWorthChart";
import { DonutChart } from "./DonutChart";
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

  const dailyBalance = useMemo(
    () => daily.reduce((sum, t) => sum + (t.type === "income" ? t.amount : -t.amount), 0),
    [daily]
  );
  const savingsBalance = useMemo(
    () => savings.reduce((sum, t) => sum + (t.direction === "in" ? t.amount : -t.amount), 0),
    [savings]
  );
  const depositoTotal = useMemo(
    () => deposito.filter((c) => c.status !== "closed").reduce((sum, c) => sum + c.principal, 0),
    [deposito]
  );

  const breakdown = computeNetWorth(dailyBalance, savingsBalance, depositoTotal);
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
      <BalanceCard label="Total net worth" balance={breakdown.total} />

      <Panel>
        <h2 className="mb-6 text-sm font-medium text-[#1A1B1E]">Proportion of net worth</h2>
        <DonutChart
          data={POCKET_META.map((p) => ({ label: p.label, value: values[p.key], color: p.color }))}
          centerLabel="Total"
          centerValue={formatIDR(breakdown.total)}
        />
        <div className="mt-6">
          <AllocationList
            items={POCKET_META.map((p) => ({
              label: p.label,
              value: values[p.key],
              color: p.color,
              icon: p.icon,
              onClick: p.key === "deposito" ? onSelectDeposito : undefined,
            }))}
          />
        </div>
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
