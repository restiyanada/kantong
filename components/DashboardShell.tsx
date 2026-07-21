"use client";

import { useState } from "react";
import { Wallet } from "lucide-react";
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
    <div className="mx-auto w-full min-w-0 max-w-5xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
      <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1A1B1E]">
            <Wallet size={15} className="text-white" strokeWidth={2} />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#1A1B1E] sm:text-[26px]">
            Kantong
          </h1>
        </div>
        <PocketTabs active={tab} onChange={setTab} />
      </div>

      <div key={tab} className="animate-fade-in-up">
        {tab === "all" && (
          <AllView
            daily={daily}
            savings={savings}
            deposito={deposito}
            todayISO={todayISO}
            onSelectDeposito={() => setTab("deposito")}
          />
        )}
        {tab === "daily" && <DailyView transactions={daily} todayISO={todayISO} />}
        {tab === "savings" && <SavingsView transactions={savings} />}
        {tab === "deposito" && (
          <DepositoView
            certificates={deposito}
            todayISO={todayISO}
            onBack={() => setTab("all")}
          />
        )}
      </div>
    </div>
  );
}
