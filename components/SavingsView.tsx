"use client";

import { useMemo } from "react";
import type { SavingsTransactionDecrypted } from "@/types";
import { computeSavingsBalance } from "@/lib/aggregations";
import { formatIDR } from "@/lib/format";
import { categoryColor } from "@/lib/categoryColors";
import { BalanceCard } from "./BalanceCard";
import { Panel } from "./Panel";

export function SavingsView({ transactions }: { transactions: SavingsTransactionDecrypted[] }) {
  const balance = useMemo(() => computeSavingsBalance(transactions), [transactions]);
  const sorted = useMemo(
    () => [...transactions].sort((a, b) => b.date.localeCompare(a.date)),
    [transactions]
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      <BalanceCard label="Savings balance" balance={balance} />

      <Panel>
        <h2 className="mb-4 text-sm font-medium text-[#1A1B1E]">Transfers</h2>
        {sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-1 py-12 text-center">
            <p className="text-sm font-medium text-[#6B6D70]">No transfers yet</p>
            <p className="text-xs text-[#ADAFAF]">Send &quot;nabung +amount note&quot; on Telegram to log one.</p>
          </div>
        ) : (
          <ul className="divide-y divide-[#F0F0EE]">
            {sorted.map((t) => (
              <li
                key={t.id}
                className="flex items-center justify-between gap-3 py-3 transition-colors duration-150 hover:bg-[#FAFAF9] sm:-mx-2 sm:px-2 sm:rounded-lg"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="w-20 shrink-0 text-xs tabular-nums text-[#8A8C8E]">{t.date}</span>
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
