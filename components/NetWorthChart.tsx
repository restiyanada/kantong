"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { displayIDR, formatShortDate } from "@/lib/format";
import { useBalanceVisibility } from "@/lib/balanceVisibility";
import type { NetWorthPoint } from "@/lib/aggregations";

export interface NetWorthSeriesConfig {
  key: "daily" | "savings" | "deposito";
  label: string;
  color: string;
}

const DEFAULT_SERIES: NetWorthSeriesConfig[] = [
  { key: "daily", label: "Daily", color: "#3B6FA0" },
  { key: "savings", label: "Savings", color: "#8659B5" },
  { key: "deposito", label: "Deposito", color: "#2E8F94" },
];

export function NetWorthChart({
  points,
  series = DEFAULT_SERIES,
}: {
  points: NetWorthPoint[];
  series?: NetWorthSeriesConfig[];
}) {
  const { hidden } = useBalanceVisibility();

  if (points.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-1 text-center">
        <p className="text-sm font-medium text-[#6B6D70]">Nothing logged in this range</p>
        <p className="text-xs text-[#ADAFAF]">Log a transaction on Telegram to see it here.</p>
      </div>
    );
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={points} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            {series.map((s) => (
              <linearGradient key={s.key} id={`fill-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={s.color} stopOpacity={0.5} />
                <stop offset="100%" stopColor={s.color} stopOpacity={0.15} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid stroke="#EFEFEC" vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={formatShortDate}
            tick={{ fontSize: 11, fill: "#8A8C8E" }}
            tickLine={false}
            axisLine={{ stroke: "#EAEAE6" }}
            minTickGap={24}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#8A8C8E" }}
            tickLine={false}
            axisLine={false}
            width={0}
          />
          <Tooltip
            formatter={(value, name) => [
              displayIDR(Number(value), hidden),
              series.find((s) => s.key === name)?.label ?? name,
            ]}
            labelFormatter={(label) => formatShortDate(String(label))}
            contentStyle={{
              borderRadius: 10,
              border: "1px solid #EAEAE6",
              boxShadow: "0 4px 12px rgba(26,27,30,0.08)",
              fontSize: 12,
            }}
          />
          <Legend
            formatter={(value) => series.find((s) => s.key === value)?.label ?? value}
            wrapperStyle={{ fontSize: 12 }}
          />
          {series.map((s) => (
            <Area
              key={s.key}
              type="monotone"
              dataKey={s.key}
              stackId="networth"
              stroke={s.color}
              strokeWidth={1.5}
              fill={`url(#fill-${s.key})`}
              animationDuration={400}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
