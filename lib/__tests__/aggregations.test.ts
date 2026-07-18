import { describe, it, expect } from "vitest";
import {
  computeDailySpend,
  filterByTimeRange,
  computeCategoryBreakdown,
  computeMonthlyTotals,
  computeDailyBalance,
  filterDailyTransactions,
  computeSavingsBalance,
  computeDepositoTotal,
  depositoBadge,
  computeNetWorth,
} from "../aggregations";
import type { DailyTransactionDecrypted, DepositoCertificateDecrypted } from "@/types";

function daily(overrides: Partial<DailyTransactionDecrypted>): DailyTransactionDecrypted {
  return {
    id: "id",
    type: "expense",
    amount: 0,
    category: "Food",
    pending: false,
    note: "",
    date: "2026-07-01",
    createdAt: "2026-07-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("computeDailySpend", () => {
  it("sums expense only per day, ignoring income, sorted chronologically", () => {
    const points = computeDailySpend([
      { date: "2026-07-02", type: "expense", amount: 100 },
      { date: "2026-07-01", type: "income", amount: 1000 },
      { date: "2026-07-01", type: "expense", amount: 40 },
      { date: "2026-07-02", type: "expense", amount: 50 },
    ]);
    expect(points).toEqual([
      { date: "2026-07-01", expense: 40 },
      { date: "2026-07-02", expense: 150 },
    ]);
  });

  it("omits days with no expense activity", () => {
    const points = computeDailySpend([{ date: "2026-07-01", type: "income", amount: 1000 }]);
    expect(points).toEqual([]);
  });
});

describe("filterByTimeRange", () => {
  const points = [
    { date: "2025-01-01", balance: 10 },
    { date: "2026-06-01", balance: 20 },
    { date: "2026-07-05", balance: 30 },
    { date: "2026-07-07", balance: 40 },
  ];
  const today = "2026-07-07";

  it("returns everything for All", () => {
    expect(filterByTimeRange(points, "All", today)).toHaveLength(4);
  });

  it("restricts to the last week for 1W", () => {
    expect(filterByTimeRange(points, "1W", today)).toEqual([
      { date: "2026-07-05", balance: 30 },
      { date: "2026-07-07", balance: 40 },
    ]);
  });

  it("restricts to year-to-date for YTD", () => {
    const result = filterByTimeRange(points, "YTD", today);
    expect(result.map((p) => p.date)).toEqual(["2026-06-01", "2026-07-05", "2026-07-07"]);
  });
});

describe("computeCategoryBreakdown", () => {
  it("sums by category for the given month, excluding pending and other months", () => {
    const txns = [
      daily({ category: "Food", amount: 25000, date: "2026-07-01" }),
      daily({ category: "Food", amount: 15000, date: "2026-07-15" }),
      daily({ category: "Transport", amount: 10000, date: "2026-07-02" }),
      daily({ category: "", amount: 99999, date: "2026-07-03", pending: true }),
      daily({ category: "Food", amount: 5000, date: "2026-06-30" }), // different month
    ];

    const result = computeCategoryBreakdown(txns, "2026-07", "expense");
    expect(result).toEqual([
      { category: "Food", total: 40000 },
      { category: "Transport", total: 10000 },
    ]);
  });
});

describe("computeMonthlyTotals", () => {
  it("includes pending entries (unlike category breakdown)", () => {
    const txns = [
      daily({ type: "expense", amount: 25000, date: "2026-07-01" }),
      daily({ type: "expense", amount: 99999, date: "2026-07-03", pending: true }),
      daily({ type: "income", amount: 5000000, date: "2026-07-05" }),
    ];
    expect(computeMonthlyTotals(txns, "2026-07")).toEqual({
      income: 5000000,
      expense: 124999,
    });
  });
});

describe("computeDailyBalance", () => {
  it("nets income and expense across all time", () => {
    expect(
      computeDailyBalance([
        { type: "income", amount: 1000 },
        { type: "expense", amount: 400 },
        { type: "income", amount: 200 },
      ])
    ).toBe(800);
  });
});

describe("filterDailyTransactions", () => {
  const txns = [
    daily({ id: "a", type: "expense", note: "nasi goreng", date: "2026-07-01" }),
    daily({ id: "b", type: "income", note: "gaji juli", date: "2026-07-05" }),
    daily({ id: "c", type: "expense", note: "ojek pulang", date: "2026-06-20" }),
  ];

  it("filters by month", () => {
    expect(filterDailyTransactions(txns, { month: "2026-07" }).map((t) => t.id)).toEqual([
      "b",
      "a",
    ]);
  });

  it("filters by type", () => {
    expect(filterDailyTransactions(txns, { type: "income" }).map((t) => t.id)).toEqual(["b"]);
  });

  it("filters by search text (case-insensitive)", () => {
    expect(filterDailyTransactions(txns, { searchText: "GORENG" }).map((t) => t.id)).toEqual([
      "a",
    ]);
  });

  it("sorts by date descending", () => {
    expect(filterDailyTransactions(txns, {}).map((t) => t.id)).toEqual(["b", "a", "c"]);
  });
});

describe("computeSavingsBalance", () => {
  it("nets in/out", () => {
    expect(
      computeSavingsBalance([
        { direction: "in", amount: 1000000 },
        { direction: "out", amount: 300000 },
      ])
    ).toBe(700000);
  });
});

describe("computeDepositoTotal", () => {
  it("excludes closed certificates", () => {
    const certs: Pick<DepositoCertificateDecrypted, "principal" | "status">[] = [
      { principal: 20_000_000, status: "active" },
      { principal: 10_000_000, status: "matured" },
      { principal: 5_000_000, status: "closed" },
    ];
    expect(computeDepositoTotal(certs)).toBe(30_000_000);
  });
});

describe("depositoBadge", () => {
  const today = "2026-07-07";

  it("shows days left for an active, not-yet-matured certificate", () => {
    expect(depositoBadge({ maturityDate: "2026-07-17", status: "active" }, today)).toEqual({
      label: "10d left",
      matured: false,
    });
  });

  it("shows Matured once maturity date has passed", () => {
    expect(depositoBadge({ maturityDate: "2026-07-01", status: "active" }, today)).toEqual({
      label: "Matured",
      matured: true,
    });
  });

  it("shows Closed for a closed certificate regardless of date", () => {
    expect(depositoBadge({ maturityDate: "2026-12-01", status: "closed" }, today)).toEqual({
      label: "Closed",
      matured: true,
    });
  });
});

describe("computeNetWorth", () => {
  it("sums the three pockets", () => {
    expect(computeNetWorth(1_000_000, 2_000_000, 20_000_000)).toEqual({
      daily: 1_000_000,
      savings: 2_000_000,
      deposito: 20_000_000,
      total: 23_000_000,
    });
  });
});
