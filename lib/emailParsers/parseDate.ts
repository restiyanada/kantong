const ENGLISH_MONTHS: Record<string, string> = {
  jan: "01", feb: "02", mar: "03", apr: "04", may: "05", jun: "06",
  jul: "07", aug: "08", sep: "09", oct: "10", nov: "11", dec: "12",
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

/** "24 Juni 2026" -> "2026-06-24" (Danamon). */
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
