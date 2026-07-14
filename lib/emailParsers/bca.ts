import { normalizeIDRAmount } from "./normalizeAmount";
import { parseEnglishAbbrevDate } from "./parseDate";
import { categorizeMerchant } from "./merchantMap";
import type { ParseResult } from "./types";

/**
 * Parses a BCA "Internet Transaction Journal" email (myBCA), e.g.:
 *
 *   Status : Berhasil
 *   Tanggal Transaksi : 13 Jul 2026 17:15:33
 *   Jenis Transaksi : Pembayaran QRIS
 *   Pembayaran Ke : FMI PLAZA OLEOS
 *   Total Bayar : IDR 5,200.00
 *   Nomor Referensi : 9527120260713171530273QRS0849819881
 *
 * Only "Pembayaran" (payment/purchase) transactions are logged. Other
 * transaction types (e.g. transfers) are skipped — we've only ever seen a
 * QRIS payment sample, so this is an assumption to revisit if a BCA
 * transfer-out email shows up looking like the Danamon self-transfer case.
 */
export function parseBCA(body: string): ParseResult {
  const statusMatch = /Status\s*:\s*(.+)/.exec(body);
  if (!statusMatch || !/berhasil/i.test(statusMatch[1])) {
    return { skip: true, reason: "transaction not successful" };
  }

  const jenisMatch = /Jenis Transaksi\s*:\s*(.+)/.exec(body);
  if (!jenisMatch || !/pembayaran/i.test(jenisMatch[1])) {
    return { skip: true, reason: "not a payment transaction" };
  }

  const amountMatch = /Total Bayar\s*:\s*(?:IDR)?\s*([\d.,]+)/i.exec(body);
  const amount = amountMatch ? normalizeIDRAmount(amountMatch[1]) : null;
  if (!amount) return null;

  const dateMatch = /Tanggal Transaksi\s*:\s*(.+)/.exec(body);
  const date = dateMatch ? parseEnglishAbbrevDate(dateMatch[1]) : null;
  if (!date) return null;

  const merchantMatch = /Pembayaran Ke\s*:\s*(.+)/.exec(body);
  const merchant = merchantMatch ? merchantMatch[1].trim() : "BCA";

  const referenceMatch = /Nomor Referensi\s*:\s*(\S+)/.exec(body);

  const category = categorizeMerchant(merchant);

  return {
    amount,
    category: category ?? "Other",
    pending: category === null,
    note: merchant,
    date,
    referenceId: referenceMatch?.[1],
  };
}
