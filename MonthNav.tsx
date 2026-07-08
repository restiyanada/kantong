"use client";

import { useState } from "react";
import { formatIDR } from "@/lib/format";
import { categoryColor } from "@/lib/categoryColors";
import { filterDailyTransactions } from "@/lib/aggregations";
import type { DailyTransactionDecrypted } from "@/types";

const TYPE_FILTERS = ["all", "expense", "income"] as const;

export function DailyTransactionList({
  transactions,
  month,
}: {
  transactions: DailyTransactionDecrypted[];
  month: string;
}) {
  const [type, setType] = useState<(typeof TYPE_FILTERS)[number]>("all");
  const [search, setSearch] = useState("");

  const filtered = filterDailyTransactions(transactions, { month, type, searchText: search });

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="flex rounded-md border border-[#E2E2DE] p-0.5">
          {TYPE_FILTERS.map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={`rounded px-3 py-1 text-xs font-medium capitalize transition-colors ${
                type === t ? "bg-[#1A1B1E] text-white" : "text-[#6B6D70]"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search notes…"
          className="ml-auto rounded-md border border-[#E2E2DE] px-3 py-1.5 text-sm text-[#1A1B1E] outline-none focus:border-[#1E7A5F]"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="py-6 text-center text-sm text-[#6B6D70]">No transactions match.</p>
      ) : (
        <ul className="divide-y divide-[#E2E2DE]">
          {filtered.map((t) => (
            <li key={t.id} className="flex items-center justify-between gap-3 py-3">
              <div className="flex min-w-0 items-center gap-3">
                <span className="w-10 shrink-0 text-xs text-[#6B6D70]">{t.date.slice(5)}</span>
                {t.pending ? (
                  <span className="shrink-0 rounded-full border border-dashed border-[#B8862B] px-2 py-0.5 text-xs text-[#B8862B]">
                    Pending
                  </span>
                ) : (
                  <span
                    className="shrink-0 rounded-full px-2 py-0.5 text-xs text-white"
                    style={{ backgroundColor: categoryColor(t.category) }}
                  >
                    {t.category}
                  </span>
                )}
                <span className="truncate text-sm text-[#1A1B1E]">{t.note || "—"}</span>
              </div>
              <span
                className={`shrink-0 tabular-nums text-sm font-medium ${
                  t.type === "income" ? "text-[#1E7A5F]" : "text-[#B23B3B]"
                }`}
              >
                {t.type === "income" ? "+" : "-"}
                {formatIDR(t.amount)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
