import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { parseBCA } from "../bca";
import { isSkip } from "../types";

beforeEach(() => {
  process.env.OWN_NAME = "restiyana";
});

afterEach(() => {
  delete process.env.OWN_NAME;
});

const QRIS_BODY_JULY = `
Status : Berhasil
Tanggal Transaksi : 13 Jul 2026 17:15:33
Jenis Transaksi : Pembayaran QRIS
Pembayaran Ke : FMI PLAZA OLEOS
Total Bayar : IDR 5,200.00
Nomor Referensi : 9527120260713171530273QRS0849819881
`;

// Real sample that exposed the Indonesian-month bug — "Mei" (May) is not
// "May" in English, and previously failed to parse entirely.
const QRIS_BODY_MEI = `
Status : Berhasil
Tanggal Transaksi : 26 Mei 2026 23:15:51
Jenis Transaksi : Pembayaran QRIS
Pembayaran Ke : Doni auto sport
Total Bayar : IDR 160,000.00
Nomor Referensi : 9527120260526231548287QRS0641233506
`;

const VA_TOPUP_BODY = `
Status : Berhasil
Tanggal Transaksi : 12 Jul 2026 12:14:57
Jenis Transaksi : Transfer ke BCA Virtual Account
Nama Perusahaan/Produk : PT AIRPAY INTERNATIONAL INDONE / SHOPEEPAY
Total Bayar : IDR 300,000.00
Nomor Referensi : 19D209DC-A016-4F47-A69C-CE21122A50AF
`;

// Real sample: a shuttle-ticket purchase (Cititrans) routed through BCA's
// VA rails. Same "Jenis Transaksi : Transfer ke BCA Virtual Account" shape
// as the ShopeePay top-up above, but the product name isn't a known
// e-wallet, so this should be logged as a real expense, not skipped.
const VA_MERCHANT_BODY = `
Status : Berhasil
Tanggal Transaksi : 21 Jul 2026 19:13:38
Jenis Transaksi : Transfer ke BCA Virtual Account
Nama Perusahaan/Produk : PT TRANS ANTAR NUSABIRD / CITITRANS
Total Bayar : IDR 360,000.00
Nomor Referensi : 4EBE3DBC-E5C0-4F76-81D7-00931CACE596
`;

const TRANSFER_TO_FRIEND_BODY = `
Status : Berhasil
Tanggal Transaksi : 20 Mei 2026 12:38:46
Jenis Transfer : Transfer ke rekening BCA
Nama Penerima : ISMA DEWI LIANA
Nominal Tujuan : IDR 38,000.00
Nomor Referensi : DB33D316-2C88-4BEA-85FF-C630A3E5104C
`;

const SELF_TRANSFER_BODY = `
Status : Berhasil
Tanggal Transaksi : 20 Mei 2026 12:38:46
Jenis Transfer : Transfer ke rekening BCA
Nama Penerima : RESTIYANA DWI ASTUTI
Nominal Tujuan : IDR 500,000.00
Nomor Referensi : SOME-REF-ID
`;

const CC_BILL_PAYMENT_BODY = `
Status : Berhasil
Tanggal Transaksi : 04 Jul 2026 19:06:08
Jenis Transaksi : Kartu Kredit & Paylater - BCA
Jumlah Tagihan : IDR 3,333,569.00
Total Bayar : IDR 3,333,569.00
Sisa Tagihan : IDR 0.00
Nomor Referensi : 9527120260704190608734TPP0930752300
`;

describe("parseBCA", () => {
  it("parses a QRIS payment (English-coincidental month abbreviation)", () => {
    const result = parseBCA(QRIS_BODY_JULY);
    if (!result || isSkip(result)) throw new Error("expected a transaction");
    expect(result.amount).toBe(5200);
    expect(result.date).toBe("2026-07-13");
    expect(result.category).toBe("Food"); // FMI is a mapped keyword
    expect(result.pending).toBe(false);
  });

  it("parses a QRIS payment dated in Mei (Indonesian May) correctly", () => {
    const result = parseBCA(QRIS_BODY_MEI);
    if (!result || isSkip(result)) throw new Error("expected a transaction");
    expect(result.amount).toBe(160000);
    expect(result.date).toBe("2026-05-26"); // not null, not misparsed
    expect(result.note).toBe("Doni auto sport");
    expect(result.category).toBe("Other"); // unmapped merchant
    expect(result.pending).toBe(true);
  });

  it("skips a BCA Virtual Account top-up (e.g. ShopeePay) — logged manually by user", () => {
    const result = parseBCA(VA_TOPUP_BODY);
    expect(isSkip(result)).toBe(true);
  });

  it("logs a non-e-wallet VA transfer (merchant paid via VA) as an expense", () => {
    const result = parseBCA(VA_MERCHANT_BODY);
    if (!result || isSkip(result)) throw new Error("expected a transaction");
    expect(result.amount).toBe(360000);
    expect(result.date).toBe("2026-07-21");
    expect(result.note).toBe("PT TRANS ANTAR NUSABIRD / CITITRANS");
    expect(result.category).toBe("Other"); // Cititrans isn't a mapped keyword
    expect(result.pending).toBe(true);
  });

  it("logs a transfer to another person as an expense", () => {
    const result = parseBCA(TRANSFER_TO_FRIEND_BODY);
    if (!result || isSkip(result)) throw new Error("expected a transaction");
    expect(result.amount).toBe(38000);
    expect(result.date).toBe("2026-05-20");
    expect(result.note).toBe("ISMA DEWI LIANA");
    expect(result.category).toBe("Other");
    expect(result.pending).toBe(true);
  });

  it("skips a transfer where the recipient is the user themself", () => {
    const result = parseBCA(SELF_TRANSFER_BODY);
    expect(isSkip(result)).toBe(true);
  });

  it("skips a credit card bill payment — settling a bill isn't new spending", () => {
    const result = parseBCA(CC_BILL_PAYMENT_BODY);
    expect(isSkip(result)).toBe(true);
  });

  it("returns null when the amount can't be found", () => {
    const result = parseBCA("Status : Berhasil\nJenis Transaksi : Pembayaran QRIS");
    expect(result).toBeNull();
  });

  it("returns null for a genuinely unrecognized BCA email shape", () => {
    const result = parseBCA("Status : Berhasil\nSome other field : value");
    expect(result).toBeNull();
  });

  it("skips a failed transaction", () => {
    const failed = QRIS_BODY_JULY.replace("Berhasil", "Gagal");
    const result = parseBCA(failed);
    expect(isSkip(result)).toBe(true);
  });
});
