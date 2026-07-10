"use client";

import { useMemo } from "react";
import type { DepositoCertificateDecrypted } from "@/types";
import { computeDepositoTotal, depositoBadge } from "@/lib/aggregations";
import { formatIDR } from "@/lib/format";
import { BalanceCard } from "./BalanceCard";
import { Panel } from "./Panel";

export function DepositoView({
  certificates,
  todayISO,
}: {
  certificates: DepositoCertificateDecrypted[];
  todayISO: string;
}) {
  const total = useMemo(() => computeDepositoTotal(certificates), [certificates]);
  const sorted = useMemo(
    () => [...certificates].sort((a, b) => b.openedDate.localeCompare(a.openedDate)),
    [certificates]
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      <BalanceCard label="Total deposito value" balance={total} />

      <Panel>
        <h2 className="mb-4 text-sm font-medium text-[#1A1B1E]">Certificates</h2>
        {sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-1 py-12 text-center">
            <p className="text-sm font-medium text-[#6B6D70]">No certificates yet</p>
            <p className="text-xs text-[#ADAFAF]">
              Send &quot;deposito amount bank term&quot; on Telegram to open one.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-[#F0F0EE]">
            {sorted.map((c) => {
              const badge = depositoBadge(c, todayISO);
              return (
                <li
                  key={c.id}
                  className="flex flex-col gap-2 py-3.5 transition-colors duration-150 hover:bg-[#FAFAF9] sm:-mx-2 sm:flex-row sm:items-center sm:justify-between sm:px-2 sm:rounded-lg"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#1A1B1E]">{c.bank}</p>
                    <p className="truncate text-xs text-[#8A8C8E]">
                      Opened {c.openedDate} · Matures {c.maturityDate}
                    </p>
                  </div>
                  <div className="flex items-center justify-between gap-3 sm:shrink-0 sm:justify-end">
                    <span className="tabular-nums text-sm font-semibold text-[#1A1B1E]">
                      {formatIDR(c.principal)}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        badge.matured
                          ? "bg-[#F0F0EE] text-[#6B6D70]"
                          : "bg-[#E9F3EF] text-[#1E7A5F]"
                      }`}
                    >
                      {badge.label}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>
    </div>
  );
}
