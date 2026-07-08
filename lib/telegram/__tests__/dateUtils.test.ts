import { describe, it, expect } from "vitest";
import { addMonths, resolveBackdatedDate } from "../dateUtils";

describe("addMonths", () => {
  it("adds months within the same year", () => {
    expect(addMonths("2026-07-07", 6)).toBe("2027-01-07");
  });

  it("clamps day overflow to the last day of the target month (non-leap)", () => {
    expect(addMonths("2026-01-31", 1)).toBe("2026-02-28");
  });

  it("clamps day overflow to the last day of the target month (leap year)", () => {
    expect(addMonths("2028-01-31", 1)).toBe("2028-02-29");
  });

  it("handles multi-year rollovers", () => {
    expect(addMonths("2026-11-15", 15)).toBe("2028-02-15");
  });
});

describe("resolveBackdatedDate", () => {
  it("uses the current year when the date is in the past", () => {
    expect(resolveBackdatedDate(25, 6, "2026-07-07")).toBe("2026-06-25");
  });

  it("rolls back a year when the date would otherwise be in the future", () => {
    expect(resolveBackdatedDate(28, 12, "2026-01-05")).toBe("2025-12-28");
  });

  it("returns null for an invalid calendar date (Feb 30)", () => {
    expect(resolveBackdatedDate(30, 2, "2026-07-07")).toBeNull();
  });

  it("returns null for an out-of-range month", () => {
    expect(resolveBackdatedDate(15, 13, "2026-07-07")).toBeNull();
  });
});
