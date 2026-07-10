"use client";

import { Wallet, PiggyBank, Landmark, LayoutGrid } from "lucide-react";
import type { ComponentType } from "react";

const TABS: { key: PocketKey; label: string; icon: ComponentType<{ size?: number; strokeWidth?: number }> }[] = [
  { key: "all", label: "All", icon: LayoutGrid },
  { key: "daily", label: "Daily", icon: Wallet },
  { key: "savings", label: "Savings", icon: PiggyBank },
  { key: "deposito", label: "Deposito", icon: Landmark },
];

export type PocketKey = "all" | "daily" | "savings" | "deposito";

export function PocketTabs({
  active,
  onChange,
}: {
  active: PocketKey;
  onChange: (key: PocketKey) => void;
}) {
  return (
    <div
      role="tablist"
      aria-label="Pocket"
      className="flex w-full gap-1 overflow-x-auto rounded-full border border-[#EAEAE6] bg-white p-1 shadow-[0_1px_2px_rgba(26,27,30,0.04)] sm:w-auto"
    >
      {TABS.map((tab) => {
        const isActive = tab.key === active;
        const Icon = tab.icon;
        return (
          <button
            key={tab.key}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.key)}
            className={`relative flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-2 text-sm font-medium transition-all duration-200 sm:flex-none sm:px-4 ${
              isActive
                ? "bg-[#1A1B1E] text-white shadow-sm"
                : "text-[#6B6D70] hover:bg-[#F7F7F5] hover:text-[#1A1B1E]"
            }`}
          >
            <Icon size={15} strokeWidth={isActive ? 2.25 : 2} />
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
