"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { formatIDR } from "@/lib/format";
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
        <BarChart data={points} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="#EFEFEC" vertical={false} />
          <XAxis
            dataKey="date"
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
            contentStyle={{
              borderRadius: 10,
              border: "1px solid #EAEAE6",
              boxShadow: "0 4px 12px rgba(26,27,30,0.08)",
              fontSize: 12,
            }}
          />
          <Bar dataKey="expense" fill="#B23B3B" radius={[3, 3, 0, 0]} animationDuration={400} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
