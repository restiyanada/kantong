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

// Names not listed above (e.g. savings goals the user invents) get a color
// picked by hashing the name, so each one stays the same color everywhere
// without having to be added here by hand.
const PALETTE = [
  "#3B6FA0",
  "#8659B5",
  "#B8862B",
  "#2E8F94",
  "#C15FA0",
  "#C1622E",
  "#5A67B8",
  "#A0673B",
  "#3E8FC4",
  "#9A4F7C",
];

function hashName(name: string): number {
  let hash = 0;
  for (const char of name) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }
  return hash;
}

export function categoryColor(category: string): string {
  return CATEGORY_COLORS[category] ?? PALETTE[hashName(category) % PALETTE.length];
}

/**
 * Colors for a set of names shown together (e.g. every savings goal). Same
 * as categoryColor, except a hashed name that would reuse a color already
 * taken in the set moves to the next free palette color, so no two rows in
 * one list look alike. Unlisted names are resolved alphabetically, so the
 * result depends only on which names are present, not their order.
 */
export function distinctColors(names: string[]): Record<string, string> {
  const result: Record<string, string> = {};
  const used = new Set<string>();

  for (const name of names) {
    const known = CATEGORY_COLORS[name];
    if (known) {
      result[name] = known;
      used.add(known);
    }
  }

  const unlisted = [...new Set(names)].filter((name) => !CATEGORY_COLORS[name]).sort();
  for (const name of unlisted) {
    const start = hashName(name) % PALETTE.length;
    let color = PALETTE[start];
    for (let step = 0; step < PALETTE.length; step++) {
      const candidate = PALETTE[(start + step) % PALETTE.length];
      if (!used.has(candidate)) {
        color = candidate;
        break;
      }
    }
    result[name] = color;
    used.add(color);
  }

  return result;
}
