const ENGLISH_MONTHS: Record<string, string> = {
  jan: "01", feb: "02", mar: "03", apr: "04", may: "05", jun: "06",
  jul: "07", aug: "08", sep: "09", oct: "10", nov: "11", dec: "12",
};

// BCA writes dates using Indonesian 3-letter abbreviations. Most overlap
// with English (Jan, Feb, Mar, Apr, Jun, Jul, Sep, Nov), but four don't:
// Mei/Agu/Okt/Des vs May/Aug/Oct/Dec — those four silently failed to parse
// under the English-only parser (only ever caught because a July 2026
// sample happened to share the same abbreviation in both languages).
const INDONESIAN_MONTH_ABBREV: Record<string, string> = {
  jan: "01", feb: "02", mar: "03", apr: "04", mei: "05", jun: "06",
  jul: "07", agu: "08", sep: "09", okt: "10", nov: "11", des: "12",
};

const INDONESIAN_MONTHS: Record<string, string> = {
  januari: "01", februari: "02", maret: "03", april: "04", mei: "05",
  juni: "06", juli: "07", agustus: "08", september: "09", oktober: "10",
  november: "11", desember: "12",
};

const ENGLISH_MONTH_PATTERN = Object.keys(ENGLISH_MONTHS).join("|");

/**
 * "13 Jul 2026" / "13 Jul 26" -> "2026-07-13" (BCA, Grab).
 *
 * The month must be a real abbreviation (not any 3 letters) and the day
 * number can't be preceded by another digit — without both guards this can
 * false-positive on unrelated text, e.g. matching the trailing "00" in
 * "Rp 13000\nTanggal\n12 Jun 26" as a fake day before ever reaching the
 * real "12 Jun 26" date that follows.
 */
export function parseEnglishAbbrevDate(text: string): string | null {
  const re = new RegExp(
    `(?<!\\d)(\\d{1,2})\\s+(${ENGLISH_MONTH_PATTERN})[a-z]*\\s+(\\d{2,4})`,
    "i"
  );
  const match = re.exec(text);
  if (!match) return null;
  const [, day, monAbbrev, yearRaw] = match;
  const month = ENGLISH_MONTHS[monAbbrev.toLowerCase()];
  if (!month) return null;
  const year = yearRaw.length === 2 ? `20${yearRaw}` : yearRaw;
  return `${year}-${month}-${day.padStart(2, "0")}`;
}

/**
 * "26 Mei 2026" / "13 Jul 2026" -> "2026-05-26" (BCA — Indonesian 3-letter
 * month abbreviations, not English). Same lookbehind protection as
 * parseEnglishAbbrevDate, for the same reason.
 */
export function parseIndonesianAbbrevDate(text: string): string | null {
  const pattern = Object.keys(INDONESIAN_MONTH_ABBREV).join("|");
  const re = new RegExp(`(?<!\\d)(\\d{1,2})\\s+(${pattern})[a-z]*\\s+(\\d{2,4})`, "i");
  const match = re.exec(text);
  if (!match) return null;
  const [, day, monAbbrev, yearRaw] = match;
  const month = INDONESIAN_MONTH_ABBREV[monAbbrev.toLowerCase()];
  if (!month) return null;
  const year = yearRaw.length === 2 ? `20${yearRaw}` : yearRaw;
  return `${year}-${month}-${day.padStart(2, "0")}`;
}

/** "24 Juni 2026" -> "2026-06-24" (Danamon — full Indonesian month names). */
export function parseIndonesianDate(text: string): string | null {
  const match = /(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/.exec(text);
  if (!match) return null;
  const [, day, monName, year] = match;
  const month = INDONESIAN_MONTHS[monName.toLowerCase()];
  if (!month) return null;
  return `${year}-${month}-${day.padStart(2, "0")}`;
}

/** "15-06-2026" (DD-MM-YYYY) -> "2026-06-15" (DBS). */
export function parseDashedDMYDate(text: string): string | null {
  const match = /(\d{2})-(\d{2})-(\d{4})/.exec(text);
  if (!match) return null;
  const [, day, month, year] = match;
  return `${year}-${month}-${day}`;
}