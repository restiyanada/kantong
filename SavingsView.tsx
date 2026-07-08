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
    <div className="flex gap-1">
      {RANGES.map((r) => (
        <button
          key={r}
          onClick={() => onChange(r)}
          className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
            value === r ? "bg-[#1A1B1E] text-white" : "text-[#6B6D70] hover:bg-[#F7F7F5]"
          }`}
        >
          {r}
        </button>
      ))}
    </div>
  );
}
