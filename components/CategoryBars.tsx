import { formatIDR } from "@/lib/format";
import { categoryColor } from "@/lib/categoryColors";
import type { CategoryTotal } from "@/lib/aggregations";

export function CategoryBars({ items }: { items: CategoryTotal[] }) {
  if (items.length === 0) {
    return <p className="py-4 text-sm text-[#6B6D70]">No transactions this month.</p>;
  }

  const max = Math.max(...items.map((i) => i.total));

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.category}>
          <div className="mb-1 flex justify-between text-sm">
            <span className="text-[#1A1B1E]">{item.category}</span>
            <span className="tabular-nums text-[#6B6D70]">{formatIDR(item.total)}</span>
          </div>
          <div className="h-2 rounded-full bg-[#F0F0EE]">
            <div
              className="h-2 rounded-full"
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
