"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { formatIDR, formatDateWithDay } from "@/lib/format";
import { categoryColor } from "@/lib/categoryColors";
import {
  filterDailyTransactions,
  groupTransactionsByDay,
  paginateDayGroups,
} from "@/lib/aggregations";
import { Pagination } from "./Pagination";
import type { DailyTransactionDecrypted } from "@/types";

const TYPE_FILTERS = ["all", "expense", "income"] as const;
const DAYS_PER_PAGE = 3;

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
  const groups = groupTransactionsByDay(filtered);
  const totalPages = Math.max(1, Math.ceil(groups.length / DAYS_PER_PAGE));
  const pagedGroups = paginateDayGroups(groups, page, DAYS_PER_PAGE);

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
        <div>
          {pagedGroups.map((group) => (
            <div key={group.date}>
              <p className="pt-4 pb-1.5 text-xs font-semibold uppercase tracking-wide text-[#ADAFAF] first:pt-0">
                {formatDateWithDay(group.date)}
              </p>
              <ul className="divide-y divide-[#F0F0EE]">
                {group.transactions.map((t) => (
                  <li
                    key={t.id}
                    className="flex items-start gap-3 py-3 transition-colors duration-150 hover:bg-[#FAFAF9] sm:-mx-2 sm:px-2 sm:rounded-lg"
                  >
                    <span
                      className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${
                        t.pending ? "border-2 border-[#B8862B] bg-white" : ""
                      }`}
                      style={t.pending ? undefined : { backgroundColor: categoryColor(t.category) }}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="truncate text-sm font-medium text-[#1A1B1E]">
                          {t.note || "—"}
                        </span>
                        <span
                          className={`shrink-0 tabular-nums text-sm font-semibold ${
                            t.type === "income" ? "text-[#1E7A5F]" : "text-[#B23B3B]"
                          }`}
                        >
                          {t.type === "income" ? "+" : "-"}
                          {formatIDR(t.amount)}
                        </span>
                      </div>
                      <p
                        className={`mt-0.5 text-xs ${
                          t.pending ? "font-medium text-[#B8862B]" : "text-[#8A8C8E]"
                        }`}
                      >
                        {t.pending ? "Needs a category" : t.category}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} onChange={setPage} />
    </div>
  );
}
