import { normalizeIDRAmount } from "./normalizeAmount";
import { parseIndonesianDate } from "./parseDate";
import { categorizeMerchant } from "./merchantMap";
import type { ParseResult } from "./types";

/**
 * Parses a D-Bank PRO (Danamon) email. Two shapes share the same sender:
 *
 *  1. "Pembayaran QRIS Berhasil" — a real purchase, has "Merchant Tujuan".
 *     Example:
 *       Merchant Tujuan   QR CITITRANS WEB
 *       Tanggal Pembayaran   24 Juni 2026 15:48
 *       Nominal   Rp.360.000,00
 *       No. Referensi   0624355032649033
 *
 *  2. "Transfer ke Rekening Lain Berhasil" — a self-transfer between the
 *     user's own accounts, not a real expense. Distinguished purely by
 *     subject line (both shapes can otherwise look similar), so this must
 *     be skipped before ever attempting to parse the body as a purchase.
 */
export function parseDanamon(subject: string, body: string): ParseResult {
  if (/transfer ke rekening lain/i.test(subject)) {
    return { skip: true, reason: "self-transfer, not an expense" };
  }
  if (!/pembayaran/i.test(subject)) {
    return { skip: true, reason: "unrecognized Danamon email type" };
  }

  const statusMatch = /Status\s+(\S+)/.exec(body);
  if (!statusMatch || !/berhasil/i.test(statusMatch[1])) {
    return { skip: true, reason: "transaction not successful" };
  }

  const amountMatch = /Nominal\s+Rp\.?\s*([\d.,]+)/.exec(body);
  const amount = amountMatch ? normalizeIDRAmount(amountMatch[1]) : null;
  if (!amount) return null;

  const dateMatch = /Tanggal Pembayaran\s+(.+)/.exec(body);
  const date = dateMatch ? parseIndonesianDate(dateMatch[1]) : null;
  if (!date) return null;

  const merchantMatch = /Merchant Tujuan\s+(.+)/.exec(body);
  const merchant = merchantMatch ? merchantMatch[1].trim() : "Danamon";

  const referenceMatch = /No\.\s*Referensi\s+(\S+)/.exec(body);

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
