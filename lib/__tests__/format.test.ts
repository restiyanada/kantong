import { describe, it, expect } from "vitest";
import { formatIDR, displaySignedIDR, formatShortDate, formatMediumDate, formatDateWithDay } from "../format";

describe("formatIDR", () => {
  it("formats as Rp with Indonesian dot thousand separators", () => {
    expect(formatIDR(1_000_000)).toBe("Rp1.000.000");
    expect(formatIDR(950)).toBe("Rp950");
  });

  it("puts the minus sign before Rp for negatives", () => {
    expect(formatIDR(-24_071_324)).toBe("-Rp24.071.324");
  });
});

describe("displaySignedIDR", () => {
  it("prefixes + on gains and keeps - on losses", () => {
    expect(displaySignedIDR(3_000_000, false)).toBe("+Rp3.000.000");
    expect(displaySignedIDR(-500, false)).toBe("-Rp500");
    expect(displaySignedIDR(0, false)).toBe("Rp0");
  });

  it("masks the amount when balances are hidden", () => {
    expect(displaySignedIDR(3_000_000, true)).toBe("Rp••••••");
  });
});

describe("formatShortDate", () => {
  it("formats as '17 Jan' (no year, no weekday)", () => {
    expect(formatShortDate("2026-01-17")).toBe("17 Jan");
  });
});

describe("formatMediumDate", () => {
  it("formats as '17 Jan 2026' (no weekday)", () => {
    expect(formatMediumDate("2026-01-17")).toBe("17 Jan 2026");
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
