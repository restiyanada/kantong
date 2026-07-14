import { describe, it, expect } from "vitest";
import { normalizeIDRAmount } from "../normalizeAmount";

describe("normalizeIDRAmount", () => {
  it("parses Grab dot-thousands format", () => {
    expect(normalizeIDRAmount("RP 13.000")).toBe(13000);
    expect(normalizeIDRAmount("RP 32.000")).toBe(32000);
  });

  it("parses Grab plain digits (no separators)", () => {
    expect(normalizeIDRAmount("IDR 1950")).toBe(1950);
    expect(normalizeIDRAmount("Rp 46100")).toBe(46100);
    expect(normalizeIDRAmount("Rp 13000")).toBe(13000);
    expect(normalizeIDRAmount("RP 5000")).toBe(5000);
  });

  it("parses BCA comma-thousands + dot-cents format", () => {
    expect(normalizeIDRAmount("IDR 5,200.00")).toBe(5200);
  });

  it("parses Danamon dot-thousands + comma-cents format", () => {
    expect(normalizeIDRAmount("Rp50.000,00")).toBe(50000);
    expect(normalizeIDRAmount("Rp.360.000,00")).toBe(360000);
  });

  it("parses DBS dot-thousands + comma-cents format", () => {
    expect(normalizeIDRAmount("IDR 79.900,00")).toBe(79900);
  });

  it("returns null for garbage input", () => {
    expect(normalizeIDRAmount("")).toBeNull();
    expect(normalizeIDRAmount("Rp -")).toBeNull();
  });
});
