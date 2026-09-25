"use client";

import { useMemo } from "react";
import { ChevronRight } from "lucide-react";
import type { DepositoCertificateDecrypted } from "@/types";
import { computeDepositoTotal, depositoBadge } from "@/lib/aggregations";
import { displayIDR, formatMediumDate } from "@/lib/format";
import { useBalanceVisibility } from "@/lib/balanceVisibility";
import { BalanceCard } from "./BalanceCard";
import { Panel } from "./Panel";

export function DepositoView({
  certificates,
  todayISO,
}: {
  certificates: DepositoCertificateDecrypted[];
  todayISO: string;
}) {
  const total = useMemo(
    () => computeDepositoTotal(certificates, todayISO),
    [certificates, todayISO]
  );
  // Same rule as the total: still locked in a term = active; matured or
  // closed = history.
  const { active, history } = useMemo(() => {
    const isActive = (c: DepositoCertificateDecrypted) =>
      c.status !== "closed" && c.maturityDate > todayISO;
    return {
      active: certificates
        .filter(isActive)
        .sort((a, b) => a.maturityDate.localeCompare(b.maturityDate)),
      history: certificates
        .filter((c) => !isActive(c))
        .sort((a, b) => b.maturityDate.localeCompare(a.maturityDate)),
    };
  }, [certificates, todayISO]);

  return (
    <div className="space-y-4 sm:space-y-6">
      <BalanceCard label="Total deposito value" balance={total} />

      <Panel>
        <h2 className="mb-4 text-sm font-medium text-[#1A1B1E]">Active</h2>
        {active.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-1 py-12 text-center">
            <p className="text-sm font-medium text-[#6B6D70]">No active certificates</p>
            <p className="text-xs text-[#ADAFAF]">
              Send &quot;deposito amount bank term&quot; on Telegram to open one.
            </p>
          </div>
        ) : (
          <CertificateList certificates={active} todayISO={todayISO} />
        )}
      </Panel>

      {history.length > 0 && (
        <Panel>
          <details className="group">
            <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-medium text-[#1A1B1E] [&::-webkit-details-marker]:hidden">
              <span>
                History <span className="font-normal text-[#8A8C8E]">({history.length})</span>
              </span>
              <ChevronRight
                size={16}
                className="text-[#ADAFAF] transition-transform duration-200 group-open:rotate-90"
              />
            </summary>
            <div className="mt-4">
              <CertificateList certificates={history} todayISO={todayISO} />
            </div>
          </details>
        </Panel>
      )}
    </div>
  );
}

function CertificateList({
  certificates,
  todayISO,
}: {
  certificates: DepositoCertificateDecrypted[];
  todayISO: string;
}) {
  const { hidden } = useBalanceVisibility();

  return (
    <ul className="divide-y divide-[#F0F0EE]">
      {certificates.map((c) => {
        const badge = depositoBadge(c, todayISO);
        return (
          <li
            key={c.id}
            className="flex flex-col gap-2 py-3.5 transition-colors duration-150 hover:bg-[#FAFAF9] sm:-mx-2 sm:flex-row sm:items-center sm:justify-between sm:px-2 sm:rounded-lg"
          >
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[#1A1B1E]">{c.bank}</p>
              <p className="truncate text-xs text-[#8A8C8E]">
                Opened {formatMediumDate(c.openedDate)} · Matures {formatMediumDate(c.maturityDate)}
              </p>
            </div>
            <div className="flex items-center justify-between gap-3 sm:shrink-0 sm:justify-end">
              <span className="tabular-nums text-sm font-semibold text-[#1A1B1E]">
                {displayIDR(c.principal, hidden)}
              </span>
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                  badge.matured ? "bg-[#F0F0EE] text-[#6B6D70]" : "bg-[#E9F3EF] text-[#1E7A5F]"
                }`}
              >
                {badge.label}
              </span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
