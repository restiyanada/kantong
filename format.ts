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
    <div className="space-y-6">
      <BalanceCard label="Savings balance" balance={balance} />

      <Panel>
        <h2 className="mb-4 text-sm font-medium text-[#1A1B1E]">Transfers</h2>
        {sorted.length === 0 ? (
          <p className="py-6 text-center text-sm text-[#6B6D70]">No transfers yet.</p>
        ) : (
          <ul className="divide-y divide-[#E2E2DE]">
            {sorted.map((t) => (
              <li key={t.id} className="flex items-center justify-between gap-3 py-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="w-20 shrink-0 text-xs text-[#6B6D70]">{t.date}</span>
                  <span
                    className="shrink-0 rounded-full px-2 py-0.5 text-xs text-white"
                    style={{ backgroundColor: categoryColor(t.goal) }}
                  >
                    {t.goal}
                  </span>
                  <span className="truncate text-sm text-[#1A1B1E]">{t.note || "—"}</span>
                </div>
                <span
                  className={`shrink-0 tabular-nums text-sm font-medium ${
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
