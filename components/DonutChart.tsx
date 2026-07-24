"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { displayIDR } from "@/lib/format";
import { useBalanceVisibility } from "@/lib/balanceVisibility";

export interface DonutSlice {
  label: string;
  value: number;
  color: string;
}

export function DonutChart({
  data,
  centerLabel,
  centerValue,
}: {
  data: DonutSlice[];
  centerLabel?: string;
  centerValue?: string;
}) {
  const { hidden } = useBalanceVisibility();
  const total = data.reduce((sum, d) => sum + Math.max(d.value, 0), 0);
  const chartData = data.map((d) => ({ ...d, sliceValue: Math.max(d.value, 0) }));

  if (total <= 0) {
    return (
      <div className="flex h-48 flex-col items-center justify-center gap-1 text-center">
        <p className="text-sm font-medium text-[#6B6D70]">Nothing to show yet</p>
      </div>
    );
  }

  return (
    <div className="relative mx-auto h-52 w-52">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            dataKey="sliceValue"
            nameKey="label"
            innerRadius="70%"
            outerRadius="100%"
            paddingAngle={4}
            cornerRadius={8}
            stroke="none"
          >
            {chartData.map((d) => (
              <Cell key={d.label} fill={d.color} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value) => displayIDR(Number(value), hidden)}
            contentStyle={{
              borderRadius: 10,
              border: "1px solid #EAEAE6",
              boxShadow: "0 4px 12px rgba(26,27,30,0.08)",
              fontSize: 12,
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      {(centerLabel || centerValue) && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          {centerLabel && <p className="text-xs text-[#8A8C8E]">{centerLabel}</p>}
          {centerValue && (
            <p className="mt-0.5 text-xl font-bold tabular-nums text-[#1A1B1E]">{centerValue}</p>
          )}
        </div>
      )}
    </div>
  );
}
