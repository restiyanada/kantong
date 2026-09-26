import { normalizeIDRAmount } from "./normalizeAmount";
import { parseIndonesianDate } from "./parseDate";
import { categorizeMerchant } from "./merchantMap";
import { decodeHtmlEntities } from "./decodeEntities";
import { getOwnNamePattern } from "./ownAccountConfig";
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
 *  2. "Transfer ke Rekening Lain Berhasil" — a transfer out. Salary lands
 *     in Danamon and is mostly passed on to the user's own BCA/DBS accounts
 *     (skipped: money isn't spent, just moved), but some goes to other
 *     people (e.g. family), which is real spending:
 *       Nama Penerima          Siti Aminah
 *       No. Rekening Penerima  1234567890
 *       Nominal Transaksi      Rp2.000.000,00
 *     The recipient name decides: the user's own name (OWN_NAME) is a
 *     self-transfer; anyone else is an expense. Without OWN_NAME configured
 *     we can't tell the two apart, so every transfer is skipped rather than
 *     risk logging the salary split as spending.
 */
export function parseDanamon(subject: string, body: string): ParseResult {
  const isTransfer = /transfer ke rekening lain/i.test(subject);
  if (!isTransfer && !/pembayaran/i.test(subject)) {
    return { skip: true, reason: "unrecognized Danamon email type" };
  }

  const statusMatch = /Status\s+(\S+)/.exec(body);
  if (!statusMatch || !/berhasil/i.test(statusMatch[1])) {
    return { skip: true, reason: "transaction not successful" };
  }

  const referenceId = /No\.\s*Referensi\s+(\S+)/.exec(body)?.[1];

  if (isTransfer) return parseTransfer(body, referenceId);

  const amountMatch = /Nominal\s+Rp\.?\s*([\d.,]+)/.exec(body);
  const amount = amountMatch ? normalizeIDRAmount(amountMatch[1]) : null;
  if (!amount) return null;

  const dateMatch = /Tanggal Pembayaran\s+(.+)/.exec(body);
  const date = dateMatch ? parseIndonesianDate(dateMatch[1]) : null;
  if (!date) return null;

  const merchantMatch = /Merchant Tujuan\s+(.+)/.exec(body);
  const merchant = decodeHtmlEntities(merchantMatch ? merchantMatch[1].trim() : "Danamon");

  const category = categorizeMerchant(merchant);

  return {
    amount,
    category: category ?? "Other",
    pending: category === null,
    note: merchant,
    date,
    referenceId,
  };
}

function parseTransfer(body: string, referenceId: string | undefined): ParseResult {
  const recipientMatch = /Nama Penerima\s+(.+)/.exec(body);
  const recipient = recipientMatch ? decodeHtmlEntities(recipientMatch[1].trim()) : null;

  const ownNamePattern = getOwnNamePattern();
  if (!recipient || !ownNamePattern || ownNamePattern.test(recipient)) {
    return { skip: true, reason: "self-transfer, not an expense" };
  }

  const amountMatch = /Nominal Transaksi\s+Rp\.?\s*([\d.,]+)/.exec(body);
  const amount = amountMatch ? normalizeIDRAmount(amountMatch[1]) : null;
  if (!amount) return null;

  const dateMatch = /Tanggal Transaksi\s+(.+)/.exec(body);
  const date = dateMatch ? parseIndonesianDate(dateMatch[1]) : null;
  if (!date) return null;

  const category = categorizeMerchant(recipient);
  return {
    amount,
    category: category ?? "Other",
    pending: category === null,
    note: `Transfer to ${recipient}`,
    date,
    referenceId,
  };
}
