import { normalizeIDRAmount } from "./normalizeAmount";
import { parseDashedDMYDate } from "./parseDate";
import { categorizeMerchant } from "./merchantMap";
import type { ParseResult } from "./types";

/**
 * Parses a DBS "Informasi Transaksi Anda" email. Unlike BCA/Danamon/Grab,
 * DBS has no labeled fields at all — everything is one sentence:
 *
 *   15-06-2026 15:12:10 Pembelian dari SpotifyID Kartu Debit sebesar IDR
 *   79.900,00 Info Customer Center 08041500327
 *
 * Also unlike the other sources, DBS emails carry no transaction reference
 * number — dedupe for this source relies entirely on the caller's Gmail
 * messageId (see /api/email), not on anything extracted here.
 */
export function parseDBS(body: string): ParseResult {
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
