import { describe, it, expect } from "vitest";
import { parseBCA } from "../bca";
import { isSkip } from "../types";

const QRIS_BODY = `
Hai RESTIYANA DWI ASTUTI,
Anda baru saja melakukan transaksi dengan menggunakan fasilitas myBCA.
Berikut ini adalah detail transaksi Anda :

Status : Berhasil
Tanggal Transaksi : 13 Jul 2026 17:15:33
Jenis Transaksi : Pembayaran QRIS
Pembayaran Ke : FMI PLAZA OLEOS
Lokasi Merchant : JAKARTA SELAT, 12550, ID
Pengakuisisi : BCA
Merchant PAN : 9360001430022454661
Terminal ID : A1BV9566
Sumber Dana : TAHAPAN - 2831****68
Customer PAN : 9360001410105802911
Total Bayar : IDR 5,200.00
RRN : 261223486
Nomor Referensi : 9527120260713171530273QRS0849819881
Mohon simpan email ini sebagai referensi transaksi Anda.
`;

describe("parseBCA", () => {
  it("parses a QRIS payment with unmapped merchant as pending Other", () => {
    const result = parseBCA(QRIS_BODY);
    expect(isSkip(result)).toBe(false);
    if (!result || isSkip(result)) throw new Error("expected a transaction");

    expect(result.amount).toBe(5200);
    expect(result.date).toBe("2026-07-13");
    expect(result.note).toBe("FMI PLAZA OLEOS");
    expect(result.category).toBe("Food");
    expect(result.pending).toBe(false);
    expect(result.referenceId).toBe(
      "9527120260713171530273QRS0849819881"
    );
  });

  it("returns null when the amount can't be found", () => {
    const result = parseBCA("Status : Berhasil\nJenis Transaksi : Pembayaran QRIS");
    expect(result).toBeNull();
  });

  it("skips a failed transaction", () => {
    const failed = QRIS_BODY.replace("Berhasil", "Gagal");
    const result = parseBCA(failed);
    expect(isSkip(result)).toBe(true);
  });
});
