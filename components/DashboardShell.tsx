"use client";

import { useState } from "react";
import type {
  DailyTransactionDecrypted,
  SavingsTransactionDecrypted,
  DepositoCertificateDecrypted,
} from "@/types";
import { PocketTabs, type PocketKey } from "./PocketTabs";
import { DailyView } from "./DailyView";
import { SavingsView } from "./SavingsView";
import { DepositoView } from "./DepositoView";
import { AllView } from "./AllView";
import {
  computeDailyBalance,
  computeSavingsBalance,
  computeDepositoTotal,
} from "@/lib/aggregations";

export function DashboardShell({
  daily,
  savings,
  deposito,
  todayISO,
}: {
  daily: DailyTransactionDecrypted[];
  savings: SavingsTransactionDecrypted[];
  deposito: DepositoCertificateDecrypted[];
  todayISO: string;
}) {
  const [tab, setTab] = useState<PocketKey>("all");

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-[#1A1B1E]">Kantong</h1>
        <PocketTabs active={tab} onChange={setTab} />
      </div>

      {tab === "all" && (
        <AllView
          daily={computeDailyBalance(daily)}
          savings={computeSavingsBalance(savings)}
          deposito={computeDepositoTotal(deposito)}
        />
      )}
      {tab === "daily" && <DailyView transactions={daily} todayISO={todayISO} />}
      {tab === "savings" && <SavingsView transactions={savings} />}
      {tab === "deposito" && <DepositoView certificates={deposito} todayISO={todayISO} />}
    </div>
  );
}
