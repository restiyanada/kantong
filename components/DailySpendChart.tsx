"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { formatIDR, formatShortDate } from "@/lib/format";
import type { DailySpendPoint } from "@/lib/aggregations";

export function DailySpendChart({ points }: { points: DailySpendPoint[] }) {
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
            <linearGradient id="spendFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#B23B3B" stopOpacity={0.18} />
              <stop offset="100%" stopColor="#B23B3B" stopOpacity={0} />
            </linearGradient>
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
            formatter={(value) => formatIDR(Number(value))}
            labelFormatter={(label) => formatShortDate(String(label))}
            contentStyle={{
              borderRadius: 10,
              border: "1px solid #EAEAE6",
              boxShadow: "0 4px 12px rgba(26,27,30,0.08)",
              fontSize: 12,
            }}
          />
          <Area
            type="monotone"
            dataKey="expense"
            stroke="#B23B3B"
            strokeWidth={2.25}
            fill="url(#spendFill)"
            animationDuration={400}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
