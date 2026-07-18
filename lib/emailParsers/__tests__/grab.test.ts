import { describe, it, expect } from "vitest";
import { parseGrab } from "../grab";
import { isSkip } from "../types";

const SUBJECT_RECEIPT = "Your Grab E-Receipt";

const RIDE_BODY = `
Bike Standard
Hope you enjoyed
your ride!
Picked up on 13 July 2026
Booking ID: A-9J3PGDOWWEQIAV
Total Paid RP 13.000
Receipt issued by the driver MOHAMAD RIZKI ABDILLAH.
Breakdown
Fare 9.000
Fare 12.000
Promo -3.000
Ride Cover opt-in 1.000
Platform Fee 3.000
Total Paid 13.000
Inclusive of VAT 4.683
VAT 464
Your Trip
0.96 km • 3 mins
⋮
⋮
Sunrise Residence Block C
8:38AM
Kertajaya Mall Main Entrance
8:42AM
`;

const GRABCAR_BODY = `
GrabCar Priority (BETA)
Congrats on getting the nearest car!
Picked up on 14 April 2026
Booking ID: A-97H4U86GXFOFAV
Total Paid RP 32.000
Receipt issued by the driver Angga Firman Candra Anggara.
Fare 25.000
Total Paid 32.000
Your Trip
2.72 km • 8 mins
⋮
⋮
⋮
⋮
Lobby RS Melati
6:57PM
No.12 Jalan Merdeka Raya
7:05PM
`;

const GRABCAR_NO_TRIP_BODY = `
GrabCar Saver
Congrats on getting the nearest car!
Picked up on 1 May 2026
Booking ID: A-9ZZZZZZZZZZZAV
Total Paid RP 20.000
`;

const GRABFOOD_BODY = `
Selamat menikmati makanan Anda!
TOTAL
Rp 46100
TANGGAL | WAKTU
07 Jul 26 19:33 +0700
Jenis Kendaraan:
GrabFood
Pesanan Dari:
Nasi Goreng Gila Ampera 89 - Ragunan
Visa : Rp 46100
TOTAL (INCL. TAX)      Rp 46100
Faktur PPN
Biaya pemesanan   Rp 2000
Total Diskon   Rp 1181
PPN   Rp 81
`;

// The OVO-paid dine-in voucher shape never says "GrabFood" or "Selamat
// menikmati makanan" — it's the tricky one caught during test-writing.
const DINE_IN_VOUCHER_BODY = `
Hope you enjoyed your food!
TOTAL
IDR 1950
TANGGAL | WAKTU
20 Jun 26 17:40 +0700
Jenis pesanan:
Dine-in Voucher
Toma Brasserie - Sudirman
Detail Pembayaran:
OVO Cash
Subtotal   IDR 1950.00
TOTAL (INCL. TAX)      IDR 1950
`;

const TIP_SUBJECT = "Your Grab E-Receipt";
const TIP_BODY = `
GrabFood
Terima kasih! Tip
darimu sudah
disalurkan ke
pengemudimu.
13 Jun 26 19:21 +0700
Total RP 5000
Tip
Lokasi Penjemputan: Jl. Ah. Nasution No. 81, Cigending, Ujung Berung, Bandung.
Kode Booking: A-9F8BD7FWXB8VAV
5000
Total 5000
100% diberikan untuk pengemudimu.
Diterbitkan oleh pengemudi
WAHYU HIDAYAT
Diterbitkan untuk
Resti
`;

const EXPRESS_SUBJECT = "Struk GrabExpress-mu";
const EXPRESS_BODY = `
Barangmu sudah dikirim!
TOTAL
Rp 13000
Tanggal
12 Jun 26
Jenis Kendaraan
GrabExpress Instant
Diterbitkan oleh Pengemudi
RIYANTO
Kode Booking
A-9F3J9KQGWM7NAV
Detail Pembayaran
Garansi Pengantaran Rp 1000
Biaya yang berlaku Rp 15000
Diskon Ongkir - Rp 3000
TOTAL Rp 13000
Faktur PPN
Subtotal Ongkir Rp 10000
PPN Rp 108.80
`;

describe("parseGrab", () => {
  it("classifies a bike ride as Transport, with pickup/destination in the note", () => {
    const result = parseGrab(SUBJECT_RECEIPT, RIDE_BODY);
    expect(isSkip(result)).toBe(false);
    if (!result || isSkip(result)) throw new Error("expected a transaction");
    expect(result.amount).toBe(13000);
    expect(result.date).toBe("2026-07-13");
    expect(result.category).toBe("Transport");
    expect(result.note).toBe("Grab Bike from Sunrise Residence Block C to Kertajaya Mall Main Entrance");
    expect(result.pending).toBe(false);
  });

  it("classifies GrabCar as Transport, ignoring the service tier and skipping decorative timeline markers", () => {
    const result = parseGrab(SUBJECT_RECEIPT, GRABCAR_BODY);
    if (!result || isSkip(result)) throw new Error("expected a transaction");
    expect(result.amount).toBe(32000);
    expect(result.date).toBe("2026-04-14");
    expect(result.category).toBe("Transport");
    expect(result.note).toBe("Grab Car from Lobby RS Melati to No.12 Jalan Merdeka Raya");
  });

  it("falls back to a generic Grab Car note when the Your Trip section is missing", () => {
    const result = parseGrab(SUBJECT_RECEIPT, GRABCAR_NO_TRIP_BODY);
    if (!result || isSkip(result)) throw new Error("expected a transaction");
    expect(result.amount).toBe(20000);
    expect(result.category).toBe("Transport");
    expect(result.note).toBe("Grab Car");
  });

  it("classifies GrabFood as Food, with the restaurant name in the note, ignoring the nested Faktur PPN amounts", () => {
    const result = parseGrab(SUBJECT_RECEIPT, GRABFOOD_BODY);
    if (!result || isSkip(result)) throw new Error("expected a transaction");
    expect(result.amount).toBe(46100); // not 1181 (Total Diskon) or 2000/81
    expect(result.date).toBe("2026-07-07");
    expect(result.category).toBe("Food");
    expect(result.note).toBe("Grab Food - Nasi Goreng Gila Ampera 89 - Ragunan");
  });

  it("falls back to a generic GrabFood note when there's no Pesanan Dari line (e.g. dine-in vouchers)", () => {
    const result = parseGrab(SUBJECT_RECEIPT, DINE_IN_VOUCHER_BODY);
    if (!result || isSkip(result)) throw new Error("expected a transaction");
    expect(result.amount).toBe(1950);
    expect(result.category).toBe("Food");
    expect(result.note).toBe("GrabFood");
  });

  it("classifies a tip as Other with the driver name in the note, not miscategorized as food", () => {
    const result = parseGrab(TIP_SUBJECT, TIP_BODY);
    if (!result || isSkip(result)) throw new Error("expected a transaction");
    expect(result.amount).toBe(5000);
    expect(result.date).toBe("2026-06-13");
    expect(result.category).toBe("Other");
    expect(result.note).toBe("Tip - WAHYU HIDAYAT");
    expect(result.pending).toBe(false);
  });

  it("classifies GrabExpress as Other, using only the top total not the Faktur PPN sub-amounts", () => {
    const result = parseGrab(EXPRESS_SUBJECT, EXPRESS_BODY);
    if (!result || isSkip(result)) throw new Error("expected a transaction");
    expect(result.amount).toBe(13000); // not 10000, 2000, or 108.80
    expect(result.date).toBe("2026-06-12");
    expect(result.category).toBe("Other");
    expect(result.note).toBe("GrabExpress");
    expect(result.pending).toBe(false);
  });

  it("returns null when no total can be found", () => {
    expect(parseGrab(SUBJECT_RECEIPT, "nothing useful here")).toBeNull();
  });
});
