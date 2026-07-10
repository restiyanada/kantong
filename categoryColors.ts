import { formatIDR } from "@/lib/format";
import { categoryColor } from "@/lib/categoryColors";
import type { CategoryTotal } from "@/lib/aggregations";

export function CategoryBars({ items }: { items: CategoryTotal[] }) {
  if (items.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-1 text-center">
        <p className="text-sm font-medium text-[#6B6D70]">No expenses this month</p>
        <p className="text-xs text-[#ADAFAF]">Categories will appear here once you log some.</p>
      </div>
    );
  }

  const max = Math.max(...items.map((i) => i.total));

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <div key={item.category}>
          <div className="mb-1.5 flex items-baseline justify-between text-sm">
            <span className="font-medium text-[#1A1B1E]">{item.category}</span>
            <span className="tabular-nums text-[#6B6D70]">{formatIDR(item.total)}</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-[#F0F0EE]">
            <div
              className="h-full rounded-full transition-[width] duration-500 ease-out"
              style={{
                width: `${(item.total / max) * 100}%`,
                backgroundColor: categoryColor(item.category),
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
