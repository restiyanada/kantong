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
    <div className="rounded-lg border border-[#E2E2DE] bg-white p-6">
      <p className="text-sm text-[#6B6D70]">{label}</p>
      <p className="mt-1 text-3xl font-semibold tabular-nums text-[#1A1B1E]">
        {formatIDR(balance)}
      </p>
      {stats && stats.length > 0 && (
        <div className="mt-4 flex gap-6">
          {stats.map((s) => (
            <div key={s.label}>
              <p className="text-xs text-[#6B6D70]">{s.label}</p>
              <p
                className={`tabular-nums text-sm font-medium ${
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
