import { displayIDR } from "@/lib/format";
import { useBalanceVisibility } from "@/lib/balanceVisibility";

export function BalanceCard({
  label,
  balance,
  caption,
}: {
  label: string;
  balance: number;
  /** One line of context under the number, e.g. "+Rp3.000.000 this month". */
  caption?: string;
}) {
  const { hidden } = useBalanceVisibility();

  return (
    <div className="relative overflow-hidden rounded-xl border border-[#EAEAE6] bg-white p-5 shadow-[0_1px_2px_rgba(26,27,30,0.04)] sm:p-8">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[#1E7A5F0D] to-transparent"
      />
      <p className="relative text-sm font-medium text-[#6B6D70]">{label}</p>
      <p
        className={`relative mt-1.5 text-[2.25rem] font-semibold leading-none tracking-tight tabular-nums sm:text-[2.75rem] ${
          balance < 0 && !hidden ? "text-[#B23B3B]" : "text-[#1A1B1E]"
        }`}
      >
        {displayIDR(balance, hidden)}
      </p>
      {caption && <p className="relative mt-2.5 text-sm text-[#8A8C8E]">{caption}</p>}
    </div>
  );
}
