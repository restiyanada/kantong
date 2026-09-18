import { describe, it, expect } from "vitest";
import { monthOf, shiftMonth, formatMonthLabel, budgetCycleOf } from "../month";

describe("monthOf", () => {
  it("extracts YYYY-MM from a date", () => {
    expect(monthOf("2026-07-15")).toBe("2026-07");
  });
});

describe("shiftMonth", () => {
  it("moves forward within the same year", () => {
    expect(shiftMonth("2026-07", 1)).toBe("2026-08");
  });

  it("moves backward across a year boundary", () => {
    expect(shiftMonth("2026-01", -1)).toBe("2025-12");
  });

  it("moves forward across a year boundary", () => {
    expect(shiftMonth("2026-12", 1)).toBe("2027-01");
  });

  it("handles multi-year jumps", () => {
    expect(shiftMonth("2026-07", -19)).toBe("2024-12");
  });
});

describe("formatMonthLabel", () => {
  it("formats as 'Month YYYY'", () => {
    expect(formatMonthLabel("2026-07")).toBe("July 2026");
  });
});

describe("budgetCycleOf", () => {
  it("assigns a date on or after the cycle day to that month's cycle", () => {
    expect(budgetCycleOf("2026-09-25", 25)).toBe("2026-09");
    expect(budgetCycleOf("2026-09-30", 25)).toBe("2026-09");
  });

  it("assigns a date before the cycle day to the previous month's cycle", () => {
    expect(budgetCycleOf("2026-09-24", 25)).toBe("2026-08");
    expect(budgetCycleOf("2026-09-01", 25)).toBe("2026-08");
  });

  it("carries the previous-month rollback across a year boundary", () => {
    expect(budgetCycleOf("2026-01-10", 25)).toBe("2025-12");
  });
});
