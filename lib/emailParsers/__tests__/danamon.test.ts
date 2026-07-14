import { describe, it, expect } from "vitest";
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

  it("skips a self-transfer entirely, regardless of body content", () => {
    const result = parseDanamon(TRANSFER_SUBJECT, TRANSFER_BODY);
    expect(isSkip(result)).toBe(true);
  });
});
