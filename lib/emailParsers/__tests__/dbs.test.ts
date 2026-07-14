import { describe, it, expect } from "vitest";
import { parseDBS } from "../dbs";
import { isSkip } from "../types";

const BODY = `
"Please do not reply this email"

Nasabah Yang Terhormat,

Terima kasih atas kepercayaan Anda kepada Bank DBS Indonesia.

Berikut merupakan informasi transaksi yang telah Anda lakukan:

15-06-2026 15:12:10 Pembelian dari SpotifyID Kartu Debit sebesar IDR
79.900,00 Info Customer Center 08041500327
`;

describe("parseDBS", () => {
  it("parses the sentence-format transaction line", () => {
    const result = parseDBS(BODY);
    expect(isSkip(result)).toBe(false);
    if (!result || isSkip(result)) throw new Error("expected a transaction");

    expect(result.amount).toBe(79900);
    expect(result.date).toBe("2026-06-15");
    expect(result.note).toBe("SpotifyID");
    // SPOTIFY is a mapped merchant keyword -> Bills, not pending
    expect(result.category).toBe("Bills");
    expect(result.pending).toBe(false);
    expect(result.referenceId).toBeUndefined();
  });

  it("returns null for unrecognized body shapes", () => {
    expect(parseDBS("nothing useful here")).toBeNull();
  });
});
