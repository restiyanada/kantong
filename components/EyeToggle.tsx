"use client";

import { Eye, EyeOff } from "lucide-react";
import { useBalanceVisibility } from "@/lib/balanceVisibility";

export function EyeToggle() {
  const { hidden, toggle } = useBalanceVisibility();

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={hidden ? "Show balances" : "Hide balances"}
      aria-pressed={hidden}
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[#6B6D70] transition-colors duration-150 hover:bg-[#F0F0EE] hover:text-[#1A1B1E]"
    >
      {hidden ? <EyeOff size={16} strokeWidth={2} /> : <Eye size={16} strokeWidth={2} />}
    </button>
  );
}
