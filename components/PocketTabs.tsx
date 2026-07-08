"use client";

const TABS = [
  { key: "all", label: "All" },
  { key: "daily", label: "Daily" },
  { key: "savings", label: "Savings" },
  { key: "deposito", label: "Deposito" },
] as const;

export type PocketKey = (typeof TABS)[number]["key"];

export function PocketTabs({
  active,
  onChange,
}: {
  active: PocketKey;
  onChange: (key: PocketKey) => void;
}) {
  return (
    <div className="inline-flex rounded-lg border border-[#E2E2DE] bg-white p-1">
      {TABS.map((tab) => {
        const isActive = tab.key === active;
        return (
          <button
            key={tab.key}
            onClick={() => onChange(tab.key)}
            className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
              isActive ? "bg-[#1A1B1E] text-white" : "text-[#6B6D70] hover:text-[#1A1B1E]"
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
