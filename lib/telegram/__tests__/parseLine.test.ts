import { describe, it, expect } from "vitest";
import { parseLine } from "../parseLine";
import { parseMessage } from "../parseMessage";

const TODAY = "2026-07-07"; // fixed reference date for deterministic tests

describe("Daily pocket (5.1, 5.2)", () => {
  it("parses a basic expense", () => {
    const result = parseLine("25000 food nasi goreng warteg deket kantor", TODAY);
    expect(result).toMatchObject({
      kind: "daily",
      type: "expense",
      amount: 25000,
      category: "Food",
      needsCategory: false,
      note: "nasi goreng warteg deket kantor",
      date: TODAY,
      backdated: false,
    });
  });

  it("parses income with a leading +", () => {
    const result = parseLine("+5000000 salary gaji juli", TODAY);
    expect(result).toMatchObject({
      kind: "daily",
      type: "income",
      amount: 5000000,
      category: "Salary",
      note: "gaji juli",
    });
  });

  it("flags an unmatched category as needing attention (5.6)", () => {
    const result = parseLine("25000 xyz something", TODAY);
    expect(result).toMatchObject({
      kind: "daily",
      category: null,
      needsCategory: true,
      note: "xyz something",
    });
  });

  it("flags a missing category (amount only)", () => {
    const result = parseLine("25000", TODAY);
    expect(result).toMatchObject({
      kind: "daily",
      category: null,
      needsCategory: true,
      note: "",
    });
  });

  it("errors when there's no valid amount", () => {
    const result = parseLine("food nasi goreng", TODAY);
    expect(result.kind).toBe("error");
  });
});

describe("Savings pocket (5.3)", () => {
  it("defaults to General when no goal keyword is present", () => {
    const result = parseLine("nabung +1000000 monthly transfer", TODAY);
    expect(result).toMatchObject({
      kind: "savings",
      direction: "in",
      amount: 1000000,
      goal: "General",
      note: "monthly transfer",
    });
  });

  it("matches an explicit goal keyword (emergency)", () => {
    const result = parseLine("nabung -500000 emergency repair", TODAY);
    expect(result).toMatchObject({
      kind: "savings",
      direction: "out",
      amount: 500000,
      goal: "Emergency",
      note: "repair",
    });
  });

  it("matches an Indonesian goal synonym (liburan -> Holiday)", () => {
    const result = parseLine("nabung +500000 liburan tabungan buat bali", TODAY);
    expect(result).toMatchObject({
      kind: "savings",
      direction: "in",
      amount: 500000,
      goal: "Holiday",
      note: "tabungan buat bali",
    });
  });

  it("errors when the amount has no sign", () => {
    const result = parseLine("nabung 500000 no sign", TODAY);
    expect(result.kind).toBe("error");
  });
});

describe("Deposito pocket (5.4)", () => {
  it("opens a new certificate with jt shorthand", () => {
    const result = parseLine("deposito 20jt bca 6bulan", TODAY);
    expect(result).toMatchObject({
      kind: "deposito_open",
      principal: 20_000_000,
      bank: "BCA",
      termMonths: 6,
      openedDate: TODAY,
      maturityDate: "2027-01-07",
    });
  });

  it("closes/withdraws a matured certificate", () => {
    const result = parseLine("deposito cairkan bca", TODAY);
    expect(result).toMatchObject({ kind: "deposito_cairkan", bank: "BCA" });
  });

  it("rolls over into a new term", () => {
    const result = parseLine("deposito perpanjang bca 6bulan", TODAY);
    expect(result).toMatchObject({
      kind: "deposito_perpanjang",
      bank: "BCA",
      termMonths: 6,
    });
  });

  it("errors on a malformed open command", () => {
    const result = parseLine("deposito 20jt bca", TODAY);
    expect(result.kind).toBe("error");
  });
});

describe("Backdated entries (5.5)", () => {
  it("applies a DD/MM prefix to a Daily line", () => {
    const result = parseLine("25/06 50000 food nasi padang", TODAY);
    expect(result).toMatchObject({
      kind: "daily",
      amount: 50000,
      category: "Food",
      date: "2026-06-25",
      backdated: true,
    });
  });

  it("applies a DD/MM prefix to a Savings line", () => {
    const result = parseLine("27/06 nabung +500000 tabungan bulanan", TODAY);
    expect(result).toMatchObject({
      kind: "savings",
      amount: 500000,
      date: "2026-06-27",
      backdated: true,
    });
  });

  it("rolls back to the previous year when the date would otherwise be in the future", () => {
    // "Today" is early January; a Dec date must mean last December.
    const result = parseLine("28/12 50000 food note", "2026-01-05");
    expect(result).toMatchObject({ date: "2025-12-28" });
  });

  it("errors on an invalid calendar date", () => {
    const result = parseLine("31/02 50000 food note", TODAY);
    expect(result.kind).toBe("error");
  });
});

describe("parseMessage (bulk paste, 5.5)", () => {
  it("parses every line from the PRD's bulk example and summarizes correctly", () => {
    const message = [
      "25/06 50000 food nasi padang",
      "25/06 20000 transport ojek",
      "26/06 120000 bills listrik",
      "27/06 nabung +500000 tabungan bulanan",
    ].join("\n");

    const result = parseMessage(message, TODAY);
    expect(result.summary).toEqual({ total: 4, logged: 4, needsAttention: 0 });
    expect(result.summaryText).toBe("4 logged, 0 need attention");
    expect(result.lines[0]).toMatchObject({ kind: "daily", category: "Food" });
    expect(result.lines[3]).toMatchObject({ kind: "savings" });
  });

  it("doesn't let one ambiguous line block the rest of the bulk paste", () => {
    const message = ["25000 food breakfast", "30000 xyz unclear item", "10000 transport bus"].join(
      "\n"
    );

    const result = parseMessage(message, TODAY);
    expect(result.summary).toEqual({ total: 3, logged: 2, needsAttention: 1 });
    expect(result.lines[1]).toMatchObject({ needsCategory: true });
    expect(result.lines[2]).toMatchObject({ category: "Transport" });
  });
});
