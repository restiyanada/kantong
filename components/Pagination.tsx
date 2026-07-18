"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

export function Pagination({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-1.5 pt-2 text-sm">
      <button
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        aria-label="Previous page"
        className="flex h-7 w-7 items-center justify-center rounded-full text-[#6B6D70] transition-colors duration-150 hover:bg-[#F0F0EE] hover:text-[#1A1B1E] disabled:pointer-events-none disabled:opacity-30"
      >
        <ChevronLeft size={16} />
      </button>
      <span className="w-20 text-center text-xs text-[#6B6D70]">
        Page {page} of {totalPages}
      </span>
      <button
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages}
        aria-label="Next page"
        className="flex h-7 w-7 items-center justify-center rounded-full text-[#6B6D70] transition-colors duration-150 hover:bg-[#F0F0EE] hover:text-[#1A1B1E] disabled:pointer-events-none disabled:opacity-30"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
}
