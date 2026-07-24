import { normalizeIDRAmount } from "./normalizeAmount";
import { parseDashedDMYDate } from "./parseDate";
import { categorizeMerchant } from "./merchantMap";
import { decodeHtmlEntities } from "./decodeEntities";
import type { ParseResult } from "./types";

/**
 * Parses a BCA credit card transaction notification, sent from
 * KartuKreditBCA@klikbca.com — a different sender/format from regular
 * BCA banking emails (bca@bca.co.id):
 *
 *   Merchant / ATM : Grab* A-9JET9XFGX9DVAV
 *   Pada Tanggal   : 16-07-2026 10:50:07 WIB
 *   Sejumlah       : Rp13.000,00
 *
 * IMPORTANT: purchases at Grab are always skipped here, even though this
 * is a real transaction — Grab's own email (no-reply@grab.com) already
 * logs every Grab charge individually. Since a Visa/credit-card-paid Grab
 * ride generates BOTH a Grab receipt AND this credit card notification
 * for the same purchase, logging both would double-count it. Every other
 * merchant has no other source watching it, so those ARE logged normally.
 */
export function parseBCACreditCard(body: string): ParseResult {
  const merchantMatch = /Merchant\s*\/\s*ATM\s*:\s*(.+)/.exec(body);
  const merchant = merchantMatch ? decodeHtmlEntities(merchantMatch[1].trim()) : null;
  if (!merchant) return null;

  if (/^grab/i.test(merchant)) {
    return {
      skip: true,
      reason: "already logged via Grab's own email — avoids double-counting",
    };
  }

  const amountMatch = /Sejumlah\s*:\s*Rp\s*([\d.,]+)/i.exec(body);
  const amount = amountMatch ? normalizeIDRAmount(amountMatch[1]) : null;
  if (!amount) return null;

  const dateMatch = /Pada Tanggal\s*:\s*(\d{2}-\d{2}-\d{4})/.exec(body);
  const date = dateMatch ? parseDashedDMYDate(dateMatch[1]) : null;
  if (!date) return null;

  const category = categorizeMerchant(merchant);

  return {
    amount,
    category: category ?? "Other",
    pending: category === null,
    note: merchant,
    date,
  };
}
