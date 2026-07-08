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
import { formatIDR } from "@/lib/format";
import type { RunningBalancePoint } from "@/lib/aggregations";

export function BalanceChart({ points }: { points: RunningBalancePoint[] }) {
  if (points.length === 0) {
    return (
      <div className="flex h-56 items-center justify-center text-sm text-[#6B6D70]">
        No data for this range yet.
      </div>
    );
  }

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={points} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="balanceFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1E7A5F" stopOpacity={0.25} />
              <stop offset="100%" stopColor="#1E7A5F" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#E2E2DE" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: "#6B6D70" }}
            tickLine={false}
            axisLine={{ stroke: "#E2E2DE" }}
            minTickGap={24}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#6B6D70" }}
            tickLine={false}
            axisLine={false}
            width={0}
          />
          <Tooltip
            formatter={(value) => formatIDR(Number(value))}
            contentStyle={{
              borderRadius: 8,
              border: "1px solid #E2E2DE",
              fontSize: 12,
            }}
          />
          <Area
            type="monotone"
            dataKey="balance"
            stroke="#1E7A5F"
            strokeWidth={2}
            fill="url(#balanceFill)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
