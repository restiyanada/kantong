"use client";

import { useMemo } from "react";
import type { DepositoCertificateDecrypted } from "@/types";
import { computeDepositoTotal, depositoBadge } from "@/lib/aggregations";
import { formatIDR } from "@/lib/format";
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
    <div className="space-y-6">
      <div className="rounded-lg border border-[#E2E2DE] bg-white p-6">
        <p className="text-sm text-[#6B6D70]">Total deposito value</p>
        <p className="mt-1 text-3xl font-semibold tabular-nums text-[#1A1B1E]">
          {formatIDR(total)}
        </p>
      </div>

      <Panel>
        <h2 className="mb-4 text-sm font-medium text-[#1A1B1E]">Certificates</h2>
        {sorted.length === 0 ? (
          <p className="py-6 text-center text-sm text-[#6B6D70]">No certificates yet.</p>
        ) : (
          <ul className="divide-y divide-[#E2E2DE]">
            {sorted.map((c) => {
              const badge = depositoBadge(c, todayISO);
              return (
                <li key={c.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[#1A1B1E]">{c.bank}</p>
                    <p className="truncate text-xs text-[#6B6D70]">
                      Opened {c.openedDate} · Matures {c.maturityDate}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="tabular-nums text-sm font-medium text-[#1A1B1E]">
                      {formatIDR(c.principal)}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
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
