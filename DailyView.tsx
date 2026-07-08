import { computeNetWorth } from "@/lib/aggregations";
import { formatIDR } from "@/lib/format";
import { Panel } from "./Panel";

export function AllView({
  daily,
  savings,
  deposito,
}: {
  daily: number;
  savings: number;
  deposito: number;
}) {
  const breakdown = computeNetWorth(daily, savings, deposito);
  const rows = [
    { label: "Daily", value: breakdown.daily, color: "#3B6FA0" },
    { label: "Savings", value: breakdown.savings, color: "#8659B5" },
    { label: "Deposito", value: breakdown.deposito, color: "#2E8F94" },
  ];
  const max = Math.max(...rows.map((r) => Math.abs(r.value)), 1);

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-[#E2E2DE] bg-white p-6">
        <p className="text-sm text-[#6B6D70]">Total net worth</p>
        <p className="mt-1 text-3xl font-semibold tabular-nums text-[#1A1B1E]">
          {formatIDR(breakdown.total)}
        </p>
      </div>

      <Panel>
        <h2 className="mb-4 text-sm font-medium text-[#1A1B1E]">Per-pocket breakdown</h2>
        <div className="space-y-4">
          {rows.map((r) => (
            <div key={r.label}>
              <div className="mb-1 flex justify-between text-sm">
                <span className="text-[#1A1B1E]">{r.label}</span>
                <span className="tabular-nums text-[#6B6D70]">{formatIDR(r.value)}</span>
              </div>
              <div className="h-2 rounded-full bg-[#F0F0EE]">
                <div
                  className="h-2 rounded-full"
                  style={{
                    width: `${(Math.abs(r.value) / max) * 100}%`,
                    backgroundColor: r.color,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
