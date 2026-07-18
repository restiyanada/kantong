"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { formatIDR, formatDateWithDay } from "@/lib/format";
import { categoryColor } from "@/lib/categoryColors";
import { filterDailyTransactions } from "@/lib/aggregations";
import { Pagination } from "./Pagination";
import type { DailyTransactionDecrypted } from "@/types";

const TYPE_FILTERS = ["all", "expense", "income"] as const;
const PAGE_SIZE = 10;

export function DailyTransactionList({
  transactions,
  month,
}: {
  transactions: DailyTransactionDecrypted[];
  month: string;
}) {
  const [type, setType] = useState<(typeof TYPE_FILTERS)[number]>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => setPage(1), [month, type, search]);

  const filtered = filterDailyTransactions(transactions, { month, type, searchText: search });
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex rounded-full bg-[#F0F0EE] p-0.5">
          {TYPE_FILTERS.map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={`flex-1 rounded-full px-3.5 py-1.5 text-xs font-medium capitalize transition-all duration-150 sm:flex-none ${
                type === t ? "bg-white text-[#1A1B1E] shadow-sm" : "text-[#6B6D70] hover:text-[#1A1B1E]"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="relative sm:ml-auto sm:w-56">
          <Search
            size={14}
            strokeWidth={2}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#ADAFAF]"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search notes…"
            className="w-full rounded-full border border-[#EAEAE6] py-1.5 pl-8 pr-3 text-sm text-[#1A1B1E] outline-none transition-colors duration-150 placeholder:text-[#ADAFAF] focus:border-[#1E7A5F]"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-1 py-12 text-center">
          <p className="text-sm font-medium text-[#6B6D70]">No transactions match</p>
          <p className="text-xs text-[#ADAFAF]">Try a different filter or search term.</p>
        </div>
      ) : (
        <ul className="divide-y divide-[#F0F0EE]">
          {paged.map((t) => (
            <li
              key={t.id}
              className="flex items-center justify-between gap-3 py-3 transition-colors duration-150 hover:bg-[#FAFAF9] sm:-mx-2 sm:px-2 sm:rounded-lg"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className="w-28 shrink-0 text-xs text-[#8A8C8E]">
                  {formatDateWithDay(t.date)}
                </span>
                {t.pending ? (
                  <span className="shrink-0 rounded-full border border-dashed border-[#B8862B] px-2 py-0.5 text-xs text-[#B8862B]">
                    Pending
                  </span>
                ) : (
                  <span
                    className="shrink-0 rounded-full px-2 py-0.5 text-xs font-medium text-white"
                    style={{ backgroundColor: categoryColor(t.category) }}
                  >
                    {t.category}
                  </span>
                )}
                <span className="truncate text-sm text-[#1A1B1E]">{t.note || "—"}</span>
              </div>
              <span
                className={`shrink-0 tabular-nums text-sm font-semibold ${
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

      <Pagination page={page} totalPages={totalPages} onChange={setPage} />
    </div>
  );
}
