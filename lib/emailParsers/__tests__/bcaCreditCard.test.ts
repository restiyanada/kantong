import { describe, it, expect } from "vitest";
import { parseBCACreditCard } from "../bcaCreditCard";
import { isSkip } from "../types";

const GRAB_CHARGE_BODY = `
Yth. Pemegang Kartu Kredit BCA,

Terima kasih telah bertransaksi menggunakan Kartu Kredit BCA:

Nomor Customer : 0000000020569104
Nomor Kartu : 455633XXXX3702
Merchant / ATM : Grab* A-9JET9XFGX9DVAV
Jenis Transaksi : E-COMMERCE
Otentikasi : TRANSAKSI TANPA OTP
Pada Tanggal : 16-07-2026 10:50:07 WIB
Sejumlah : Rp13.000,00
`;

const OTHER_MERCHANT_BODY = `
Yth. Pemegang Kartu Kredit BCA,

Terima kasih telah bertransaksi menggunakan Kartu Kredit BCA:

Nomor Customer : 0000000020569104
Nomor Kartu : 455633XXXX3702
Merchant / ATM : Toko Bunga Mawar
Jenis Transaksi : E-COMMERCE
Otentikasi : TRANSAKSI TANPA OTP
Pada Tanggal : 16-07-2026 10:50:07 WIB
Sejumlah : Rp250.000,00
`;

describe("parseBCACreditCard", () => {
  it("skips a Grab charge — already logged via Grab's own email, would double-count otherwise", () => {
    const result = parseBCACreditCard(GRAB_CHARGE_BODY);
    expect(isSkip(result)).toBe(true);
  });

  it("logs a non-Grab merchant normally — no other source captures these", () => {
    const result = parseBCACreditCard(OTHER_MERCHANT_BODY);
    if (!result || isSkip(result)) throw new Error("expected a transaction");
    expect(result.amount).toBe(250000);
    expect(result.date).toBe("2026-07-16");
    expect(result.note).toBe("Toko Bunga Mawar");
    expect(result.category).toBe("Other"); // unmapped merchant
    expect(result.pending).toBe(true);
  });

  it("returns null when the merchant field can't be found", () => {
    expect(parseBCACreditCard("nothing useful here")).toBeNull();
  });
});
