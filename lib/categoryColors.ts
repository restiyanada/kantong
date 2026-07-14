/**
 * Consistent category/goal → color mapping (used in bars, tags, and lists).
 * Deliberately avoids the green/red reserved for income/expense sign.
 */
const CATEGORY_COLORS: Record<string, string> = {
  Food: "#3B6FA0",
  Transport: "#8659B5",
  Bills: "#B8862B",
  Shopping: "#2E8F94",
  Health: "#C15FA0",
  Entertainment: "#C1622E",
  Other: "#6B6D70",
  Salary: "#1E7A5F",
  "Other Income": "#2E8F94",
  Holiday: "#8659B5",
  Emergency: "#B8862B",
  General: "#3B6FA0",
};

const FALLBACK_COLOR = "#9A9A94";

export function categoryColor(category: string): string {
  return CATEGORY_COLORS[category] ?? FALLBACK_COLOR;
}
