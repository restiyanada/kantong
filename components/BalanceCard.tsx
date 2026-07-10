import { formatIDR } from "@/lib/format";

export function BalanceCard({
  label,
  balance,
  stats,
}: {
  label: string;
  balance: number;
  stats?: { label: string; value: number; tone: "positive" | "negative" }[];
}) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-[#EAEAE6] bg-white p-5 shadow-[0_1px_2px_rgba(26,27,30,0.04)] sm:p-8">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[#1E7A5F0D] to-transparent"
      />
      <p className="relative text-sm font-medium text-[#6B6D70]">{label}</p>
      <p className="relative mt-1.5 text-[2.25rem] font-semibold leading-none tracking-tight tabular-nums text-[#1A1B1E] sm:text-[2.75rem]">
        {formatIDR(balance)}
      </p>
      {stats && stats.length > 0 && (
        <div className="relative mt-6 flex flex-wrap gap-x-8 gap-y-3 border-t border-[#F0F0EE] pt-5">
          {stats.map((s) => (
            <div key={s.label}>
              <p className="text-xs text-[#8A8C8E]">{s.label}</p>
              <p
                className={`mt-0.5 tabular-nums text-sm font-semibold ${
                  s.tone === "positive" ? "text-[#1E7A5F]" : "text-[#B23B3B]"
                }`}
              >
                {formatIDR(s.value)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
