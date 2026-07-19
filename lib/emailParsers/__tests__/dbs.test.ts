import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { parseDBS } from "../dbs";
import { isSkip } from "../types";

beforeEach(() => {
  process.env.OWN_ACCOUNT_ALIASES = "uwi";
});

afterEach(() => {
  delete process.env.OWN_ACCOUNT_ALIASES;
});

const SUBJECT_OLD = "DBS - Informasi Transaksi Anda";
const OLD_SENTENCE_BODY = `
"Please do not reply this email"

Nasabah Yang Terhormat,

Terima kasih atas kepercayaan Anda kepada Bank DBS Indonesia.

Berikut merupakan informasi transaksi yang telah Anda lakukan:

15-06-2026 15:12:10 Pembelian dari SpotifyID Kartu Debit sebesar IDR
79.900,00 Info Customer Center 08041500327
`;

const SUBJECT_QRIS = "digibank - Pembayaran QRIS Berhasil";
// Real format is one flat line with double-spaces between fields, NOT
// newline-separated — an earlier newline-based test fixture masked a real
// bug where the merchant regex greedily captured every field after it.
const DIGIBANK_QRIS_BODY =
  "Hai, RESTIYANA DWI ASTUTI,   Pembayaran QRIS pada tanggal 16 Jul 2026 sebesar Rp173800 di REMBOELAN CITOS berhasil. Berikut adalah rincian transaksinya:   1.Waktu Transaksi (tanggal & jam): 16 Jul 2026 & 11:47:08  2.Status Transaksi: SUCCESS  3.Nama Acquirer: PT Bank Central Asia  4.Nama Merchant: REMBOELAN CITOS  5.Lokasi Merchant: JAKARTA SELATID12430  6.Merchant PAN: 9360001430012876808  7.Terminal ID: A2749034  8.Customer PAN: 9360004610010547249  9.Reff ID: 20260716114701956262  10.Total Pembayaran: Rp173800  11.Tips Amount (jika ada): Rp0  12.Source Of Fund: 1706006653  13.Transaction Type: Pembayaran  14.RRN: 114708745118";

const SUBJECT_SELF_TRANSFER = "digibank - Konfirmasi transfer ke rekening DBS kamu";
const SELF_TRANSFER_BODY = `
Hai, RESTIYANA DWI ASTUTI,

Kamu telah berhasil melakukan transfer sebesar Rp 1000000  ke rekening yang berakhiran 6653 pada 15-Jul-2026.
`;

const SUBJECT_OTHER_BANK = "digibank – Transfer Ke Rekening Bank Lain Berhasil";
const OTHER_BANK_TRANSFER_BODY = `
Hai RESTIYANA DWI ASTUTI,

Kamu telah berhasil melakukan transfer sebesar Rp 31000 dari rekening yang berakhiran ******6653 ke ******4742
pada 15-Jul-2026.
`;

describe("parseDBS", () => {
  it("parses the old sentence-format purchase (dbsindonesia@1bank.dbs.com)", () => {
    const result = parseDBS(SUBJECT_OLD, OLD_SENTENCE_BODY);
    if (!result || isSkip(result)) throw new Error("expected a transaction");
    expect(result.amount).toBe(79900);
    expect(result.date).toBe("2026-06-15");
    expect(result.note).toBe("SpotifyID");
    expect(result.category).toBe("Bills");
    expect(result.pending).toBe(false);
  });

  it("parses the new digibank numbered-list QRIS purchase", () => {
    const result = parseDBS(SUBJECT_QRIS, DIGIBANK_QRIS_BODY);
    if (!result || isSkip(result)) throw new Error("expected a transaction");
    expect(result.amount).toBe(173800);
    expect(result.date).toBe("2026-07-16");
    expect(result.note).toBe("REMBOELAN CITOS");
    expect(result.category).toBe("Other"); // unmapped merchant
    expect(result.pending).toBe(true);
    expect(result.referenceId).toBe("20260716114701956262");
  });

  it("parses the real FMI PLAZA OLEOS email that exposed the greedy-merchant-regex bug", () => {
    const realBody =
      "Hai, RESTIYANA DWI ASTUTI,   Pembayaran QRIS pada tanggal 17 Jul 2026 sebesar Rp19900 di FMI PLAZA OLEOS berhasil. Berikut adalah rincian transaksinya:   1.Waktu Transaksi (tanggal & jam): 17 Jul 2026 & 08:46:13  2.Status Transaksi: SUCCESS  3.Nama Acquirer: PT Bank Central Asia  4.Nama Merchant: FMI PLAZA OLEOS  5.Lokasi Merchant: JAKARTA SELATID12550  6.Merchant PAN: 9360001430022454661  7.Terminal ID: A1BV9566  8.Customer PAN: 9360004610010547249  9.Reff ID: 20260717084607246651  10.Total Pembayaran: Rp19900  11.Tips Amount (jika ada): Rp0  12.Source Of Fund: 1706006653  13.Transaction Type: Pembayaran  14.RRN: 084613749783";
    const result = parseDBS(SUBJECT_QRIS, realBody);
    if (!result || isSkip(result)) throw new Error("expected a transaction");
    expect(result.amount).toBe(19900);
    expect(result.date).toBe("2026-07-17");
    // The bug: this used to capture the ENTIRE rest of the string instead
    // of stopping at "FMI PLAZA OLEOS".
    expect(result.note).toBe("FMI PLAZA OLEOS");
    expect(result.category).toBe("Food"); // FMI is a mapped keyword
    expect(result.pending).toBe(false);
  });

  it("skips a transfer to the user's own DBS account", () => {
    const result = parseDBS(SUBJECT_SELF_TRANSFER, SELF_TRANSFER_BODY);
    expect(isSkip(result)).toBe(true);
  });

  it("logs a transfer to a different bank account as an expense (no name available, only masked account)", () => {
    const result = parseDBS(SUBJECT_OTHER_BANK, OTHER_BANK_TRANSFER_BODY);
    if (!result || isSkip(result)) throw new Error("expected a transaction");
    expect(result.amount).toBe(31000);
    expect(result.date).toBe("2026-07-15");
    expect(result.note).toBe("DBS transfer to ****4742");
    expect(result.category).toBe("Other");
    expect(result.pending).toBe(true);
  });

  it("skips a DBS-to-other-bank transfer when the destination nickname is the user's own account (real bug: Bca_uwi.pdf)", () => {
    const realBody = `
Hai RESTIYANA DWI ASTUTI,

Kamu telah berhasil melakukan transfer sebesar Rp 1000000 dari rekening berakhiran 6653 ke bca uwi dengan
nomor rekening berakhiran 6068 pada 10-Jul-2026.
`;
    const result = parseDBS(SUBJECT_OTHER_BANK, realBody);
    expect(isSkip(result)).toBe(true);
  });

  it("returns null for unrecognized body/subject shapes", () => {
    expect(parseDBS("some random subject", "nothing useful here")).toBeNull();
  });
});