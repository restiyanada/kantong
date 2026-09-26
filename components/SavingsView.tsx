"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { SavingsTransactionDecrypted } from "@/types";
import { computeSavingsBalance, computeGoalBreakdown } from "@/lib/aggregations";
import { displayIDR, displaySignedIDR, formatDateWithDay } from "@/lib/format";
import { renameSavingsGoal } from "@/app/actions";
import { distinctColors } from "@/lib/categoryColors";
import { useBalanceVisibility } from "@/lib/balanceVisibility";
import { BalanceCard } from "./BalanceCard";
import { Panel } from "./Panel";
import { AllocationList } from "./AllocationList";

/** Bottom sheet (native <dialog>) to rename a goal, or merge it into another. */
function RenameGoalSheet({
  goal,
  otherGoals,
  onClose,
}: {
  goal: string;
  otherGoals: string[];
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => ref.current?.showModal(), []);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      className="m-0 mb-0 mt-auto w-full max-w-none rounded-t-2xl p-5 pb-8 backdrop:bg-black/40 sm:mx-auto sm:mb-auto sm:max-w-sm sm:rounded-2xl"
    >
      <form action={renameSavingsGoal.bind(null, goal)} onSubmit={onClose} className="space-y-3">
        <h3 className="text-sm font-medium text-[#1A1B1E]">Rename &quot;{goal}&quot;</h3>
        <input
          name="to"
          type="text"
          defaultValue={goal}
          list="savings-goal-options"
          required
          className="w-full rounded-lg border border-[#EAEAE6] px-3 py-2 text-base"
        />
        <datalist id="savings-goal-options">
          {otherGoals.map((g) => (
            <option key={g} value={g} />
          ))}
        </datalist>
        {otherGoals.length > 0 && (
          <p className="text-xs text-[#8A8C8E]">
            Pick an existing goal ({otherGoals.join(", ")}) to merge into it.
          </p>
        )}
        <div className="flex gap-2 pt-1">
          <button
            type="submit"
            className="flex-1 rounded-lg bg-[#1A1B1E] py-2.5 text-sm font-medium text-white"
          >
            Save
          </button>
          <button
            type="button"
            onClick={() => ref.current?.close()}
            className="flex-1 rounded-lg border border-[#EAEAE6] py-2.5 text-sm text-[#6B6D70]"
          >
            Cancel
          </button>
        </div>
      </form>
    </dialog>
  );
}

export function SavingsView({
  transactions,
  todayISO,
}: {
  transactions: SavingsTransactionDecrypted[];
  todayISO: string;
}) {
  const { hidden } = useBalanceVisibility();
  const [renaming, setRenaming] = useState<string | null>(null);
  const balance = useMemo(() => computeSavingsBalance(transactions), [transactions]);
  const thisMonth = useMemo(
    () => computeSavingsBalance(transactions.filter((t) => t.date.startsWith(todayISO.slice(0, 7)))),
    [transactions, todayISO]
  );
  const goalBreakdown = useMemo(() => computeGoalBreakdown(transactions), [transactions]);
  const colors = useMemo(
    () => distinctColors(transactions.map((t) => t.goal)),
    [transactions]
  );
  const sorted = useMemo(
    () => [...transactions].sort((a, b) => b.date.localeCompare(a.date)),
    [transactions]
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      <BalanceCard
        label="Savings balance"
        balance={balance}
        caption={`${displaySignedIDR(thisMonth, hidden)} this month`}
      />

      {goalBreakdown.length > 0 && (
        <Panel>
          <h2 className="mb-5 text-sm font-medium text-[#1A1B1E]">By goal</h2>
          <AllocationList
            items={goalBreakdown.map((g) => ({
              label: g.goal,
              value: g.balance,
              color: colors[g.goal],
              onClick: () => setRenaming(g.goal),
            }))}
          />
          {renaming && (
            <RenameGoalSheet
              goal={renaming}
              otherGoals={goalBreakdown.map((g) => g.goal).filter((g) => g !== renaming)}
              onClose={() => setRenaming(null)}
            />
          )}
        </Panel>
      )}

      <Panel>
        <h2 className="mb-4 text-sm font-medium text-[#1A1B1E]">Transfers</h2>
        {sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-1 py-12 text-center">
            <p className="text-sm font-medium text-[#6B6D70]">No transfers yet</p>
            <p className="text-xs text-[#ADAFAF]">
              Send &quot;nabung +amount note&quot; on Telegram to log one.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-[#F0F0EE]">
            {sorted.map((t) => (
              <li
                key={t.id}
                className="flex flex-col gap-2 py-3 transition-colors duration-150 hover:bg-[#FAFAF9] sm:-mx-2 sm:flex-row sm:items-center sm:justify-between sm:px-2 sm:rounded-lg"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="w-28 shrink-0 text-xs text-[#8A8C8E]">
                    {formatDateWithDay(t.date)}
                  </span>
                  <span
                    className="shrink-0 rounded-full px-2 py-0.5 text-xs font-medium text-white"
                    style={{ backgroundColor: colors[t.goal] }}
                  >
                    {t.goal}
                  </span>
                  <span className="truncate text-sm text-[#1A1B1E]">{t.note || "—"}</span>
                </div>
                <span
                  className={`shrink-0 tabular-nums text-sm font-semibold ${
                    t.direction === "in" ? "text-[#1E7A5F]" : "text-[#B23B3B]"
                  }`}
                >
                  {t.direction === "in" ? "+" : "-"}
                  {displayIDR(t.amount, hidden)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
