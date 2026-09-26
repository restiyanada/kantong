import { describe, it, expect, afterEach } from "vitest";
import { parseDanamon } from "../danamon";
import { isSkip } from "../types";

const QRIS_SUBJECT = "Pembayaran QRIS Berhasil (Tidak Perlu Dibalas)";
const QRIS_BODY = `
Pembayaran QRIS Berhasil
Nasabah Yth.
Terima kasih telah menggunakan D-Bank PRO. Dengan ini kami informasikan bahwa
transaksi QRIS telah berhasil.

Detail Transaksi
Status Berhasil
No. Referensi 0624355032649033
Merchant Tujuan QR CITITRANS WEB
Lokasi JAKARTA SELATAN, 12790, ID
Tanggal Pembayaran 24 Juni 2026 15:48
Acquirer BANK BNI
Merchant PAN 9360000915040777714
Customer PAN 9360001111400122608
Reff ID 240625951201
Terminal ID

Detail Nominal
Nominal Rp.360.000,00
Jumlah Rp.360.000,00

Sumber Dana
RESTIYANA DWI ASTUTI
BANK DANAMON *** 1768
`;

const TRANSFER_SUBJECT = "Transfer ke Rekening Lain Berhasil (Tidak Perlu Dibalas)";
const TRANSFER_BODY = `
Transfer ke Rekening Lain Berhasil
Nasabah Yth.
Terima kasih telah menggunakan D-Bank PRO. Dengan ini kami informasikan bahwa
Transfer ke Rekening Lain telah berhasil. Berikut merupakan detail transaksi Anda:

Detail Transaksi
Status Berhasil
No. Referensi 2026070719581198780
Tanggal Transaksi 07 Juli 2026, 19:58
Nama Penerima Restiyana Dwi Astuti
Bank Tujuan BANK CENTRAL ASIA
No. Rekening Penerima 2831816068
Metode Transfer BI-FAST
Tujuan Transfer Pemindahan Dana

Detail Nominal
Nominal Transaksi Rp50.000,00
Jumlah Rp50.000,00
`;

// Same template as TRANSFER_BODY (taken from a real email), with the values
// of a real transfer to the user's mum (name and account number replaced).
const MUM_TRANSFER_BODY = `
Transfer ke Rekening Lain Berhasil
Nasabah Yth.
Terima kasih telah menggunakan D-Bank PRO. Dengan ini kami informasikan bahwa
Transfer ke Rekening Lain telah berhasil. Berikut merupakan detail transaksi Anda:

Detail Transaksi
Status Berhasil
No. Referensi 2026092520010676931
Tanggal Transaksi 25 September 2026, 20:01
Nama Penerima Siti Aminah
Bank Tujuan BANK RAKYAT INDONESIA
No. Rekening Penerima 1234567890
Metode Transfer BI-FAST
Tujuan Transfer Pemindahan Dana

Detail Nominal
Nominal Transaksi Rp2.000.000,00
Jumlah Rp2.000.000,00
`;

afterEach(() => {
  delete process.env.OWN_NAME;
});

describe("parseDanamon", () => {
  it("parses a QRIS payment with unmapped merchant as pending Other", () => {
    const result = parseDanamon(QRIS_SUBJECT, QRIS_BODY);
    expect(isSkip(result)).toBe(false);
    if (!result || isSkip(result)) throw new Error("expected a transaction");

    expect(result.amount).toBe(360000);
    expect(result.date).toBe("2026-06-24");
    expect(result.note).toBe("QR CITITRANS WEB");
    expect(result.category).toBe("Other");
    expect(result.pending).toBe(true);
    expect(result.referenceId).toBe("0624355032649033");
  });

  it("skips a transfer to the user's own account", () => {
    process.env.OWN_NAME = "restiyana";
    expect(isSkip(parseDanamon(TRANSFER_SUBJECT, TRANSFER_BODY))).toBe(true);
  });

  it("logs a transfer to someone else as a pending expense named after the recipient", () => {
    process.env.OWN_NAME = "restiyana";
    const result = parseDanamon(TRANSFER_SUBJECT, MUM_TRANSFER_BODY);
    if (!result || isSkip(result)) throw new Error("expected a transaction");
    expect(result.amount).toBe(2000000);
    expect(result.date).toBe("2026-09-25");
    expect(result.note).toBe("Transfer to Siti Aminah");
    expect(result.category).toBe("Other");
    expect(result.pending).toBe(true);
    expect(result.referenceId).toBe("2026092520010676931");
  });

  it("skips every transfer when OWN_NAME isn't configured, rather than guess", () => {
    expect(isSkip(parseDanamon(TRANSFER_SUBJECT, MUM_TRANSFER_BODY))).toBe(true);
  });
});
