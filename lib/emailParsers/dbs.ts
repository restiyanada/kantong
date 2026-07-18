import { normalizeIDRAmount } from "./normalizeAmount";
import { parseDashedDMYDate, parseIndonesianAbbrevDate } from "./parseDate";
import { categorizeMerchant } from "./merchantMap";
import type { ParseResult } from "./types";

/**
 * DBS sends from two different addresses with different formats:
 *
 *  1. dbsindonesia@1bank.dbs.com — old sentence-style, one flat sentence:
 *       15-06-2026 15:12:10 Pembelian dari SpotifyID Kartu Debit sebesar
 *       IDR 79.900,00 Info Customer Center 08041500327
 *
 *  2. digibankid@dbs.com — newer "digibank" numbered-list style, three
 *     subject-line shapes distinguished by exact wording:
 *       "digibank - Pembayaran QRIS Berhasil"        -> purchase, log it
 *       "digibank - Konfirmasi transfer ke rekening DBS kamu"
 *                                                      -> transfer to the
 *          user's OWN DBS account ("kamu" = "you") — always skipped
 *       "digibank – Transfer Ke Rekening Bank Lain Berhasil"
 *                                                      -> transfer to a
 *          DIFFERENT (non-DBS) bank account — no recipient name is ever
 *          given, just a masked account suffix, so unlike BCA we can't
 *          check for a self-transfer by name. The subject line itself is
 *          the only reliable signal DBS gives us, and it already
 *          distinguishes "your account" from "another account" for us.
 *          Logged as an expense (money genuinely left the user's DBS
 *          account to a different bank).
 */
export function parseDBS(subject: string, body: string): ParseResult {
  const sentenceResult = parseOldSentenceFormat(body);
  if (sentenceResult) return sentenceResult;

  if (/rekening dbs kamu/i.test(subject)) {
    return { skip: true, reason: "self-transfer, not an expense" };
  }
  if (/rekening bank lain/i.test(subject)) {
    return parseTransferToOtherBank(body);
  }
  if (/pembayaran qris/i.test(subject)) {
    return parseDigibankQRIS(body);
  }

  return null; // unrecognized DBS email shape
}

function parseOldSentenceFormat(body: string): ParseResult {
  const match =
    /(\d{2}-\d{2}-\d{4})\s+\d{2}:\d{2}:\d{2}\s+Pembelian dari\s+(.+?)\s+Kartu Debit sebesar IDR\s+([\d.,]+)/.exec(
      body
    );
  if (!match) return null;

  const [, dateRaw, merchantRaw, amountRaw] = match;

  const amount = normalizeIDRAmount(amountRaw);
  if (!amount) return null;

  const date = parseDashedDMYDate(dateRaw);
  if (!date) return null;

  const merchant = merchantRaw.trim();
  const category = categorizeMerchant(merchant);

  return {
    amount,
    category: category ?? "Other",
    pending: category === null,
    note: merchant,
    date,
  };
}

function parseDigibankQRIS(body: string): ParseResult {
  const amountMatch = /Total Pembayaran:\s*Rp\s*([\d.,]+)/i.exec(body);
  const amount = amountMatch ? normalizeIDRAmount(amountMatch[1]) : null;
  if (!amount) return null;

  const dateMatch = /Waktu Transaksi[^:]*:\s*(.+?)&/.exec(body);
  const date = dateMatch ? parseIndonesianAbbrevDate(dateMatch[1]) : null;
  if (!date) return null;

  const merchantMatch = /Nama Merchant:\s*(.+?)(?:\s{2,}\d+\.|$)/.exec(body);
  const merchant = merchantMatch ? merchantMatch[1].trim() : "DBS";

  const referenceMatch = /Reff ID:\s*(\S+)/.exec(body);

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

function parseTransferToOtherBank(body: string): ParseResult {
  const amountMatch = /transfer sebesar Rp\s*([\d.,]+)/i.exec(body);
  const amount = amountMatch ? normalizeIDRAmount(amountMatch[1]) : null;
  if (!amount) return null;

  const dateMatch = /pada\s+(\d{1,2}[\s-]+[A-Za-z]+[\s-]+\d{2,4})/i.exec(body);
  const date = dateMatch ? parseIndonesianAbbrevDate(dateMatch[1]) : null;
  if (!date) return null;

  // No recipient name is ever given — just a masked destination account
  // suffix, e.g. "ke ******4742". That's all we can put in the note.
  const destMatch = /ke\s+\**(\d{3,})/i.exec(body);
  const note = destMatch ? `DBS transfer to ****${destMatch[1]}` : "DBS transfer";

  return {
    amount,
    category: "Other",
    pending: true,
    note,
    date,
  };
}