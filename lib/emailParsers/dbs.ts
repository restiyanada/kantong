import { normalizeIDRAmount } from "./normalizeAmount";
import { parseDashedDMYDate, parseIndonesianAbbrevDate } from "./parseDate";
import { categorizeMerchant } from "./merchantMap";
import { decodeHtmlEntities } from "./decodeEntities";
import { getOwnAccountAliases } from "./ownAccountConfig";
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
 *          DIFFERENT (non-DBS) bank account. No recipient name is given,
 *          but DBS does show a saved nickname for the destination account
 *          (e.g. "ke bca uwi ... nomor rekening berakhiran 6068"). If that
 *          nickname matches one of the user's own account aliases, it's a
 *          self-transfer and should be skipped, same as BCA/Danamon.
 *          Otherwise it's logged as a real expense (money genuinely left
 *          the user's DBS account to someone else's account).
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

  const merchant = decodeHtmlEntities(merchantRaw.trim());
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
  const merchant = decodeHtmlEntities(merchantMatch ? merchantMatch[1].trim() : "DBS");

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
  // The destination nickname sits between "ke" and "dengan nomor rekening",
  // e.g. "ke bca uwi dengan nomor rekening berakhiran 6068" -> "bca uwi".
  // If it matches one of the user's own account aliases, this is money
  // moving between the user's own accounts, not real spending.
  const destNameMatch = /ke\s+([a-z\s]+?)\s+dengan\s+nomor\s+rekening/i.exec(body);
  const destName = destNameMatch?.[1] ? decodeHtmlEntities(destNameMatch[1].trim()).toLowerCase() : undefined;
  const ownAliases = getOwnAccountAliases();
  if (destName && ownAliases.some((alias) => destName.includes(alias))) {
    return { skip: true, reason: "self-transfer, not an expense" };
  }

  const amountMatch = /transfer sebesar Rp\s*([\d.,]+)/i.exec(body);
  const amount = amountMatch ? normalizeIDRAmount(amountMatch[1]) : null;
  if (!amount) return null;

  const dateMatch = /pada\s+(\d{1,2}[\s-]+[A-Za-z]+[\s-]+\d{2,4})/i.exec(body);
  const date = dateMatch ? parseIndonesianAbbrevDate(dateMatch[1]) : null;
  if (!date) return null;

  // Masked destination account suffix, used as a fallback note when there's
  // no recognizable nickname (e.g. a transfer to someone else's account).
  const destMatch = /ke\s+\**(\d{3,})/i.exec(body);
  const note = destName ? `Transfer to ${destName}` : destMatch ? `DBS transfer to ****${destMatch[1]}` : "DBS transfer";

  return {
    amount,
    category: "Other",
    pending: true,
    note,
    date,
  };
}