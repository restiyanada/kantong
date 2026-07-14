/**
 * Keyword → canonical category/goal maps.
 *
 * ASSUMPTION (flagged for review): the PRD's Telegram examples only show
 * bare English category words ("food", "salary", "emergency") plus one
 * Indonesian goal synonym ("liburan" → Holiday). Since notes are otherwise
 * written in Indonesian, a few obvious Indonesian synonyms are included
 * below for usability. Adjust freely — these maps are the single place to
 * tune matching.
 */

export const DAILY_EXPENSE_CATEGORY_KEYWORDS: Record<string, string> = {
  food: "Food",
  makan: "Food",
  makanan: "Food",
  transport: "Transport",
  transportasi: "Transport",
  bills: "Bills",
  tagihan: "Bills",
  shopping: "Shopping",
  belanja: "Shopping",
  health: "Health",
  kesehatan: "Health",
  entertainment: "Entertainment",
  hiburan: "Entertainment",
  other: "Other",
  lainnya: "Other",
};

export const DAILY_INCOME_CATEGORY_KEYWORDS: Record<string, string> = {
  salary: "Salary",
  gaji: "Salary",
  income: "Other Income",
  pemasukan: "Other Income",
};

export const SAVINGS_GOAL_KEYWORDS: Record<string, string> = {
  holiday: "Holiday",
  liburan: "Holiday",
  vacation: "Holiday",
  emergency: "Emergency",
  darurat: "Emergency",
  general: "General",
  umum: "General",
};

export const SAVINGS_DEFAULT_GOAL = "General";

/**
 * Checks whether `words[0]` matches a keyword in `map`. If so, returns the
 * canonical category/goal and the remaining words (as the note). If not,
 * returns null and leaves `words` untouched — the caller decides what to
 * do (Daily: flag needsCategory; Savings: fall back to a default goal).
 */
export function matchLeadingKeyword(
  words: string[],
  map: Record<string, string>
): { matched: string; rest: string[] } | null {
  if (words.length === 0) return null;
  const canonical = map[words[0].toLowerCase()];
  if (!canonical) return null;
  return { matched: canonical, rest: words.slice(1) };
}
