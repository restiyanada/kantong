"use client";

import { useMemo } from "react";
import type { SavingsTransactionDecrypted } from "@/types";
import { computeSavingsBalance, computeGoalBreakdown } from "@/lib/aggregations";
import { formatIDR, formatDateWithDay } from "@/lib/format";
import { categoryColor } from "@/lib/categoryColors";
import { BalanceCard } from "./BalanceCard";
import { Panel } from "./Panel";
import { DonutChart } from "./DonutChart";
import { AllocationList } from "./AllocationList";

export function SavingsView({ transactions }: { transactions: SavingsTransactionDecrypted[] }) {
  const balance = useMemo(() => computeSavingsBalance(transactions), [transactions]);
  const goalBreakdown = useMemo(() => computeGoalBreakdown(transactions), [transactions]);
  const sorted = useMemo(
    () => [...transactions].sort((a, b) => b.date.localeCompare(a.date)),
    [transactions]
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      <BalanceCard label="Savings balance" balance={balance} />

      {goalBreakdown.length > 0 && (
        <Panel>
          <h2 className="mb-6 text-sm font-medium text-[#1A1B1E]">By goal</h2>
          <DonutChart
            data={goalBreakdown.map((g) => ({
              label: g.goal,
              value: g.balance,
              color: categoryColor(g.goal),
            }))}
            centerLabel="Savings"
            centerValue={formatIDR(balance)}
          />
          <div className="mt-6">
            <AllocationList
              items={goalBreakdown.map((g) => ({
                label: g.goal,
                value: g.balance,
                color: categoryColor(g.goal),
              }))}
            />
          </div>
        </Panel>
      )}

      <Panel>
        <h2 className="mb-4 text-sm font-medium text-[#1A1B1E]">Transfers</h2>
        {sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-1 py-12 text-center">
            <p className="text-sm font-medium text-[#6B6D70]">No transfers yet</p>
            <p className="text-xs text-[#ADAFAF]">
              Send &quot;nabung +amount note&quot; on Telegram to log one.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-[#F0F0EE]">
            {sorted.map((t) => (
              <li
                key={t.id}
                className="flex flex-col gap-2 py-3 transition-colors duration-150 hover:bg-[#FAFAF9] sm:-mx-2 sm:flex-row sm:items-center sm:justify-between sm:px-2 sm:rounded-lg"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="w-28 shrink-0 text-xs text-[#8A8C8E]">
                    {formatDateWithDay(t.date)}
                  </span>
                  <span
                    className="shrink-0 rounded-full px-2 py-0.5 text-xs font-medium text-white"
                    style={{ backgroundColor: categoryColor(t.goal) }}
                  >
                    {t.goal}
                  </span>
                  <span className="truncate text-sm text-[#1A1B1E]">{t.note || "—"}</span>
                </div>
                <span
                  className={`shrink-0 tabular-nums text-sm font-semibold ${
                    t.direction === "in" ? "text-[#1E7A5F]" : "text-[#B23B3B]"
                  }`}
                >
                  {t.direction === "in" ? "+" : "-"}
                  {formatIDR(t.amount)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
