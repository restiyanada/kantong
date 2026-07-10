import { getTodayISO, resolveBackdatedDate, addMonths } from "./dateUtils";
import { parseSignedAmount, parseMagnitude, parseTermMonths } from "./amount";
import {
  DAILY_EXPENSE_CATEGORY_KEYWORDS,
  DAILY_INCOME_CATEGORY_KEYWORDS,
  SAVINGS_GOAL_KEYWORDS,
  SAVINGS_DEFAULT_GOAL,
  matchLeadingKeyword,
} from "./categories";
import type { ParsedLine } from "./types";

const BACKDATE_PREFIX = /^(\d{1,2})\/(\d{1,2})\s+(.+)$/;

/**
 * Parses a single line of Telegram input into a structured entry.
 * `todayISO` is injectable for testing; defaults to "today" in Jakarta time.
 */
export function parseLine(
  rawLine: string,
  todayISO: string = getTodayISO()
): ParsedLine {
  const trimmed = rawLine.trim();
  if (!trimmed) {
    return { kind: "error", rawLine, message: "Empty line" };
  }

  let date = todayISO;
  let backdated = false;
  let remainder = trimmed;

  const backdateMatch = BACKDATE_PREFIX.exec(trimmed);
  if (backdateMatch) {
    const day = Number(backdateMatch[1]);
    const month = Number(backdateMatch[2]);
    const resolved = resolveBackdatedDate(day, month, todayISO);
    if (!resolved) {
      return {
        kind: "error",
        rawLine,
        message: `"${backdateMatch[1]}/${backdateMatch[2]}" isn't a valid date`,
      };
    }
    date = resolved;
    backdated = true;
    remainder = backdateMatch[3].trim();
  }

  const tokens = remainder.split(/\s+/).filter(Boolean);
  const first = tokens[0]?.toLowerCase();

  if (first === "nabung") {
    return parseSavingsLine(rawLine, tokens.slice(1), date, backdated);
  }
  if (first === "deposito") {
    return parseDepositoLine(rawLine, tokens.slice(1), date, backdated);
  }
  return parseDailyLine(rawLine, tokens, date, backdated);
}

function parseDailyLine(
  rawLine: string,
  tokens: string[],
  date: string,
  backdated: boolean
): ParsedLine {
  const signed = tokens[0] ? parseSignedAmount(tokens[0]) : null;
  if (!signed) {
    return {
      kind: "error",
      rawLine,
      message: "Couldn't find a valid amount (expected `<amount> <category> <note>`)",
    };
  }

  const type: "income" | "expense" = signed.sign === "+" ? "income" : "expense";
  const categoryKeywords =
    type === "income" ? DAILY_INCOME_CATEGORY_KEYWORDS : DAILY_EXPENSE_CATEGORY_KEYWORDS;

  const rest = tokens.slice(1);
  const matched = matchLeadingKeyword(rest, categoryKeywords);

  return {
    kind: "daily",
    rawLine,
    type,
    amount: signed.value,
    category: matched?.matched ?? null,
    needsCategory: !matched,
    note: (matched?.rest ?? rest).join(" "),
    date,
    backdated,
  };
}

function parseSavingsLine(
  rawLine: string,
  tokens: string[],
  date: string,
  backdated: boolean
): ParsedLine {
  const signed = tokens[0] ? parseSignedAmount(tokens[0]) : null;
  if (!signed || !signed.sign) {
    return {
      kind: "error",
      rawLine,
      message:
        "Savings entries need a leading + or - on the amount (expected `nabung <+/-amount> <note>`)",
    };
  }

  const rest = tokens.slice(1);
  const matched = matchLeadingKeyword(rest, SAVINGS_GOAL_KEYWORDS);

  return {
    kind: "savings",
    rawLine,
    direction: signed.sign === "+" ? "in" : "out",
    amount: signed.value,
    goal: matched?.matched ?? SAVINGS_DEFAULT_GOAL,
    note: (matched?.rest ?? rest).join(" "),
    date,
    backdated,
  };
}

function parseDepositoLine(
  rawLine: string,
  tokens: string[],
  date: string,
  backdated: boolean
): ParsedLine {
  const action = tokens[0]?.toLowerCase();

  if (action === "cairkan") {
    const bank = tokens[1];
    if (!bank) {
      return {
        kind: "error",
        rawLine,
        message: "Expected `deposito cairkan <bank>`",
      };
    }
    return { kind: "deposito_cairkan", rawLine, bank: bank.toUpperCase() };
  }

  if (action === "perpanjang") {
    const bank = tokens[1];
    const termMonths = tokens[2] ? parseTermMonths(tokens[2]) : null;
    if (!bank || termMonths == null) {
      return {
        kind: "error",
        rawLine,
        message: "Expected `deposito perpanjang <bank> <N>bulan`",
      };
    }
    return {
      kind: "deposito_perpanjang",
      rawLine,
      bank: bank.toUpperCase(),
      termMonths,
    };
  }

  // Otherwise: opening a new certificate, e.g. "deposito 20jt bca 6bulan"
  const [principalToken, bank, termToken] = tokens;
  const principal = principalToken ? parseMagnitude(principalToken) : null;
  const termMonths = termToken ? parseTermMonths(termToken) : null;

  if (principal == null || !bank || termMonths == null) {
    return {
      kind: "error",
      rawLine,
      message: "Expected `deposito <amount> <bank> <N>bulan`",
    };
  }

  return {
    kind: "deposito_open",
    rawLine,
    principal,
    bank: bank.toUpperCase(),
    termMonths,
    openedDate: date,
    maturityDate: addMonths(date, termMonths),
    backdated,
  };
}
