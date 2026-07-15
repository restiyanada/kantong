import { normalizeIDRAmount } from "./normalizeAmount";
import { parseIndonesianAbbrevDate } from "./parseDate";
import { categorizeMerchant } from "./merchantMap";
import type { ParseResult } from "./types";

// Used to detect a transfer to the user's own name/accounts, which should
// never be logged as an expense (money isn't actually leaving the user).
const OWN_NAME_PATTERN = /restiyana/i;

/**
 * Parses a BCA "Internet Transaction Journal" email (myBCA). BCA sends (at
 * least) two shapes, distinguishable by which field is present:
 *
 *  1. "Jenis Transaksi" field — QRIS/card payments and BCA Virtual Account
 *     transfers (e.g. e-wallet top-ups):
 *       Jenis Transaksi : Pembayaran QRIS         -> log as expense
 *       Jenis Transaksi : Transfer ke BCA Virtual Account
 *                                                   -> always skipped (the
 *          user tops up e-wallets like ShopeePay and logs real purchases
 *          from them manually, so the top-up itself shouldn't double-count)
 *
 *  2. "Jenis Transfer" field — a direct BCA-to-BCA account transfer:
 *       Jenis Transfer : Transfer ke rekening BCA
 *       Nama Penerima  : ISMA DEWI LIANA
 *     Logged as an expense if the recipient isn't the user themself —
 *     money sent to another person is real spending. A transfer where
 *     "Nama Penerima" matches the user's own name is a self-transfer
 *     between accounts and is skipped, same as Danamon's self-transfers.
 *
 * Dates use Indonesian 3-letter month abbreviations (parseIndonesianAbbrevDate),
 * not English — "Mei"/"Agu"/"Okt"/"Des" differ from "May"/"Aug"/"Oct"/"Dec"
 * and would silently fail to parse under an English-only parser.
 */
export function parseBCA(body: string): ParseResult {
  const statusMatch = /Status\s*:\s*(.+)/.exec(body);
  if (!statusMatch || !/berhasil/i.test(statusMatch[1])) {
    return { skip: true, reason: "transaction not successful" };
  }

  const referenceMatch = /Nomor Referensi\s*:\s*(\S+)/.exec(body);
  const referenceId = referenceMatch?.[1];

  const jenisTransaksiMatch = /Jenis Transaksi\s*:\s*(.+)/.exec(body);
  if (jenisTransaksiMatch) {
    return parsePembayaranOrVA(body, jenisTransaksiMatch[1], referenceId);
  }

  const jenisTransferMatch = /Jenis Transfer\s*:\s*(.+)/.exec(body);
  if (jenisTransferMatch) {
    return parseAccountTransfer(body, referenceId);
  }

  return null; // neither known field present — genuinely unrecognized shape
}

function parsePembayaranOrVA(
  body: string,
  jenis: string,
  referenceId: string | undefined
): ParseResult {
  if (/transfer ke bca virtual account/i.test(jenis)) {
    return { skip: true, reason: "e-wallet top-up, logged manually by user" };
  }
  if (!/pembayaran/i.test(jenis)) {
    return { skip: true, reason: "not a payment transaction" };
  }

  const amountMatch = /Total Bayar\s*:\s*(?:IDR)?\s*([\d.,]+)/i.exec(body);
  const amount = amountMatch ? normalizeIDRAmount(amountMatch[1]) : null;
  if (!amount) return null;

  const dateMatch = /Tanggal Transaksi\s*:\s*(.+)/.exec(body);
  const date = dateMatch ? parseIndonesianAbbrevDate(dateMatch[1]) : null;
  if (!date) return null;

  const merchantMatch = /Pembayaran Ke\s*:\s*(.+)/.exec(body);
  const merchant = merchantMatch ? merchantMatch[1].trim() : "BCA";

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

function parseAccountTransfer(
  body: string,
  referenceId: string | undefined
): ParseResult {
  const recipientMatch = /Nama Penerima\s*:\s*(.+)/.exec(body);
  const recipient = recipientMatch ? recipientMatch[1].trim() : null;

  if (!recipient) return null;
  if (OWN_NAME_PATTERN.test(recipient)) {
    return { skip: true, reason: "self-transfer, not an expense" };
  }

  const amountMatch = /Nominal Tujuan\s*:\s*(?:IDR)?\s*([\d.,]+)/i.exec(body);
  const amount = amountMatch ? normalizeIDRAmount(amountMatch[1]) : null;
  if (!amount) return null;

  const dateMatch = /Tanggal Transaksi\s*:\s*(.+)/.exec(body);
  const date = dateMatch ? parseIndonesianAbbrevDate(dateMatch[1]) : null;
  if (!date) return null;

  const category = categorizeMerchant(recipient);

  return {
    amount,
    category: category ?? "Other",
    pending: category === null,
    note: recipient,
    date,
    referenceId,
  };
}