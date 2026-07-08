import { describe, it, expect } from "vitest";
import { monthOf, shiftMonth, formatMonthLabel } from "../month";

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
