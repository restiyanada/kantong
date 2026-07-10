"use client";

import type { TimeRange } from "@/lib/aggregations";

const RANGES: TimeRange[] = ["1W", "1M", "3M", "YTD", "1Y", "All"];

export function TimeRangeTabs({
  value,
  onChange,
}: {
  value: TimeRange;
  onChange: (range: TimeRange) => void;
}) {
  return (
    <div className="flex gap-0.5 rounded-full bg-[#F0F0EE] p-0.5">
      {RANGES.map((r) => (
        <button
          key={r}
          onClick={() => onChange(r)}
          className={`rounded-full px-2.5 py-1 text-xs font-medium transition-all duration-150 ${
            value === r
              ? "bg-white text-[#1A1B1E] shadow-sm"
              : "text-[#6B6D70] hover:text-[#1A1B1E]"
          }`}
        >
          {r}
        </button>
      ))}
    </div>
  );
}
