/**
 * Result of parsing a single line of Telegram input (PRD section 5).
 * A multi-line bulk paste is parsed line-by-line into an array of these.
 */

export interface DailyParsed {
  kind: "daily";
  rawLine: string;
  type: "income" | "expense";
  amount: number;
  /** null when the category couldn't be matched — see `needsCategory`. */
  category: string | null;
  /** True when the bot should fall back to inline category buttons (5.6). */
  needsCategory: boolean;
  note: string;
  date: string; // YYYY-MM-DD
  backdated: boolean;
}

export interface SavingsParsed {
  kind: "savings";
  rawLine: string;
  direction: "in" | "out";
  amount: number;
  /** Defaults to "General" when no goal keyword is recognized. */
  goal: string;
  note: string;
  date: string; // YYYY-MM-DD
  backdated: boolean;
}

export interface DepositoOpenParsed {
  kind: "deposito_open";
  rawLine: string;
  principal: number;
  bank: string;
  termMonths: number;
  openedDate: string; // YYYY-MM-DD
  maturityDate: string; // YYYY-MM-DD
  backdated: boolean;
}

export interface DepositoCairkanParsed {
  kind: "deposito_cairkan";
  rawLine: string;
  bank: string;
}

export interface DepositoPerpanjangParsed {
  kind: "deposito_perpanjang";
  rawLine: string;
  bank: string;
  termMonths: number;
}

export interface ParseErrorResult {
  kind: "error";
  rawLine: string;
  message: string;
}

export type ParsedLine =
  | DailyParsed
  | SavingsParsed
  | DepositoOpenParsed
  | DepositoCairkanParsed
  | DepositoPerpanjangParsed
  | ParseErrorResult;
