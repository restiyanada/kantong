"use client";

import { shiftMonth, formatMonthLabel } from "@/lib/month";

export function MonthNav({
  month,
  onChange,
}: {
  month: string;
  onChange: (month: string) => void;
}) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <button
        onClick={() => onChange(shiftMonth(month, -1))}
        aria-label="Previous month"
        className="rounded-md border border-[#E2E2DE] px-2 py-1 text-[#1A1B1E] hover:bg-[#F7F7F5]"
      >
        ‹
      </button>
      <span className="w-32 text-center font-medium tabular-nums text-[#1A1B1E]">
        {formatMonthLabel(month)}
      </span>
      <button
        onClick={() => onChange(shiftMonth(month, 1))}
        aria-label="Next month"
        className="rounded-md border border-[#E2E2DE] px-2 py-1 text-[#1A1B1E] hover:bg-[#F7F7F5]"
      >
        ›
      </button>
    </div>
  );
}
