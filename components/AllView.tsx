import { Wallet, PiggyBank, Landmark } from "lucide-react";
import { computeNetWorth } from "@/lib/aggregations";
import { formatIDR } from "@/lib/format";
import { BalanceCard } from "./BalanceCard";
import { Panel } from "./Panel";

const POCKET_META = [
  { key: "daily", label: "Daily", color: "#3B6FA0", tint: "#3B6FA014", icon: Wallet },
  { key: "savings", label: "Savings", color: "#8659B5", tint: "#8659B514", icon: PiggyBank },
  { key: "deposito", label: "Deposito", color: "#2E8F94", tint: "#2E8F9414", icon: Landmark },
] as const;

export function AllView({
  daily,
  savings,
  deposito,
}: {
  daily: number;
  savings: number;
  deposito: number;
}) {
  const breakdown = computeNetWorth(daily, savings, deposito);
  const values: Record<string, number> = {
    daily: breakdown.daily,
    savings: breakdown.savings,
    deposito: breakdown.deposito,
  };
  const max = Math.max(...Object.values(values).map(Math.abs), 1);

  return (
    <div className="space-y-4 sm:space-y-6">
      <BalanceCard label="Total net worth" balance={breakdown.total} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {POCKET_META.map((p) => {
          const Icon = p.icon;
          const value = values[p.key];
          return (
            <Panel key={p.key}>
              <div
                className="flex h-9 w-9 items-center justify-center rounded-full"
                style={{ backgroundColor: p.tint }}
              >
                <Icon size={16} color={p.color} strokeWidth={2.25} />
              </div>
              <p className="mt-3 text-xs font-medium text-[#8A8C8E]">{p.label}</p>
              <p className="mt-0.5 text-lg font-semibold tabular-nums text-[#1A1B1E]">
                {formatIDR(value)}
              </p>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#F0F0EE]">
                <div
                  className="h-full rounded-full transition-[width] duration-500 ease-out"
                  style={{ width: `${(Math.abs(value) / max) * 100}%`, backgroundColor: p.color }}
                />
              </div>
            </Panel>
          );
        })}
      </div>
    </div>
  );
}
