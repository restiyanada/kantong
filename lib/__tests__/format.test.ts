import { describe, it, expect } from "vitest";
import { formatIDR, formatShortDate, formatDateWithDay } from "../format";

describe("formatIDR", () => {
  it("formats as Rp with thousand separators", () => {
    expect(formatIDR(1_000_000)).toBe("Rp1,000,000");
  });
});

describe("formatShortDate", () => {
  it("formats as '17 Jan' (no year, no weekday)", () => {
    expect(formatShortDate("2026-01-17")).toBe("17 Jan");
  });
});

describe("formatDateWithDay", () => {
  it("formats as 'Sat, 17 Jan 2026'", () => {
    expect(formatDateWithDay("2026-01-17")).toBe("Sat, 17 Jan 2026");
  });

  it("pads single-digit days without a leading zero (day is numeric, not fixed-width)", () => {
    expect(formatDateWithDay("2026-07-01")).toBe("Wed, 1 Jul 2026");
  });
});
