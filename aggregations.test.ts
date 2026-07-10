"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { shiftMonth, formatMonthLabel } from "@/lib/month";

export function MonthNav({
  month,
  onChange,
}: {
  month: string;
  onChange: (month: string) => void;
}) {
  return (
    <div className="flex items-center gap-1.5 text-sm">
      <button
        onClick={() => onChange(shiftMonth(month, -1))}
        aria-label="Previous month"
        className="flex h-7 w-7 items-center justify-center rounded-full text-[#6B6D70] transition-colors duration-150 hover:bg-[#F0F0EE] hover:text-[#1A1B1E]"
      >
        <ChevronLeft size={16} />
      </button>
      <span className="w-28 text-center font-medium tabular-nums text-[#1A1B1E]">
        {formatMonthLabel(month)}
      </span>
      <button
        onClick={() => onChange(shiftMonth(month, 1))}
        aria-label="Next month"
        className="flex h-7 w-7 items-center justify-center rounded-full text-[#6B6D70] transition-colors duration-150 hover:bg-[#F0F0EE] hover:text-[#1A1B1E]"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
}
