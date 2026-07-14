import type { DailyExpenseCategory } from "@/types";

/**
 * Merchant keyword -> category, per PRD_Auto_Log_Bank_Emails.md section 6.
 * Case-insensitive partial match; first match in this list wins.
 * Categories use the app's real casing (types/index.ts), not the PRD's
 * lowercase examples.
 */
const MERCHANT_KEYWORDS: Array<[string, DailyExpenseCategory]> = [
  ["GRAB", "Transport"],
  ["GOJEK", "Transport"],
  ["BLUE BIRD", "Transport"],
  ["STARBUCKS", "Food"],
  ["SBUX", "Food"],
  ["FMI", "Food"],
  ["BARRACI", "Food"],
  ["CILOK", "Food"],
  ["MCDONALD", "Food"],
  ["KFC", "Food"],
  ["INDOMARET", "Food"],
  ["ALFAMART", "Food"],
  ["NETFLIX", "Bills"],
  ["SPOTIFY", "Bills"],
  ["PLN", "Bills"],
  ["PDAM", "Bills"],
  ["TOKOPEDIA", "Shopping"],
  ["SHOPEE", "Shopping"],
  ["LAZADA", "Shopping"],
  ["CINEMAXX", "Entertainment"],
  ["CGV", "Entertainment"],
  ["TIX ID", "Entertainment"],
  ["KIMIA FARMA", "Health"],
  ["APOTEK", "Health"],
];

/**
 * Looks up a category for a merchant/description string. Returns null if no
 * keyword matches — caller should log as category "Other", pending: true.
 */
export function categorizeMerchant(
  merchant: string
): DailyExpenseCategory | null {
  const upper = merchant.toUpperCase();
  for (const [keyword, category] of MERCHANT_KEYWORDS) {
    if (upper.includes(keyword)) return category;
  }
  return null;
}