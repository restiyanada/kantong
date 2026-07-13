"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { formatIDR } from "@/lib/format";

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
    <div className="flex flex-col items-center gap-6 sm:flex-row">
      <div className="relative h-40 w-40 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              dataKey="sliceValue"
              nameKey="label"
              innerRadius="65%"
              outerRadius="100%"
              paddingAngle={2}
              stroke="none"
            >
              {chartData.map((d) => (
                <Cell key={d.label} fill={d.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => formatIDR(Number(value))}
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
              <p className="text-sm font-semibold tabular-nums text-[#1A1B1E]">{centerValue}</p>
            )}
          </div>
        )}
      </div>
      <div className="w-full space-y-2.5">
        {data.map((d) => {
          const pct = total > 0 ? (Math.max(d.value, 0) / total) * 100 : 0;
          return (
            <div key={d.label} className="flex items-center justify-between gap-3 text-sm">
              <div className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: d.color }}
                />
                <span className="text-[#1A1B1E]">{d.label}</span>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className="tabular-nums text-[#6B6D70]">{formatIDR(d.value)}</span>
                <span className="w-9 text-right text-xs tabular-nums text-[#ADAFAF]">
                  {pct.toFixed(0)}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
