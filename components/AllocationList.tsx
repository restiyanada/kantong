import type { ComponentType } from "react";
import { ChevronRight } from "lucide-react";
import { displayIDR } from "@/lib/format";
import { useBalanceVisibility } from "@/lib/balanceVisibility";

export interface AllocationItem {
  label: string;
  value: number;
  color: string;
  icon?: ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  onClick?: () => void;
  /** When set, the bar fills toward this budget limit instead of the row's share of the total, and turns red past it. */
  limit?: number;
}

export function AllocationList({ items }: { items: AllocationItem[] }) {
  const { hidden } = useBalanceVisibility();
  const total = items.reduce((sum, i) => sum + Math.max(i.value, 0), 0);
  const max = Math.max(...items.map((i) => i.value), 1);

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {items.map((item) => {
        const Icon = item.icon;
        const hasLimit = item.limit != null && item.limit > 0;
        const overBudget = hasLimit && item.value > item.limit!;
        const negative = item.value < 0;
        const pct = total > 0 && !negative ? (item.value / total) * 100 : 0;
        const budgetPct = hasLimit ? (item.value / item.limit!) * 100 : 0;
        // A negative pocket can't be a share of the total, so it gets no bar.
        const barWidthPct = negative
          ? 0
          : hasLimit
            ? Math.min(100, budgetPct)
            : (item.value / max) * 100;
        const barColor = overBudget ? "#B23B3B" : item.color;
        const Wrapper = item.onClick ? "button" : "div";
        return (
          <Wrapper
            key={item.label}
            {...(item.onClick ? { onClick: item.onClick, type: "button" } : {})}
            className={`block w-full text-left ${
              item.onClick ? "cursor-pointer rounded-lg -mx-2 px-2 py-1 transition-colors duration-150 hover:bg-[#FAFAF9]" : ""
            }`}
          >
            <div className="mb-1.5 flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2.5">
                {Icon ? (
                  <span
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
                    style={{ backgroundColor: item.color + "1A" }}
                  >
                    <Icon size={14} color={item.color} strokeWidth={2.25} />
                  </span>
                ) : (
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                )}
                <span className="truncate text-sm font-medium text-[#1A1B1E]">{item.label}</span>
              </div>
              <div className="flex shrink-0 items-baseline gap-2">
                <span
                  className={`tabular-nums text-sm font-semibold ${
                    (negative && !hidden) || overBudget ? "text-[#B23B3B]" : "text-[#1A1B1E]"
                  }`}
                >
                  {displayIDR(item.value, hidden)}
                  {hasLimit && (
                    <span className="font-normal text-[#8A8C8E]"> / {displayIDR(item.limit!, hidden)}</span>
                  )}
                </span>
                {!negative && (
                  <span
                    className={`w-9 text-right tabular-nums text-xs ${
                      overBudget ? "font-medium text-[#B23B3B]" : "text-[#8A8C8E]"
                    }`}
                  >
                    {Math.round(hasLimit ? budgetPct : pct)}%
                  </span>
                )}
                {item.onClick && <ChevronRight size={15} className="self-center text-[#ADAFAF]" />}
              </div>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-[#F0F0EE]">
              <div
                className="h-full rounded-full transition-[width] duration-500 ease-out"
                style={{
                  width: barWidthPct + "%",
                  backgroundColor: barColor,
                }}
              />
            </div>
          </Wrapper>
        );
      })}
    </div>
  );
}
