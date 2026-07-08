import { getTodayISO } from "./dateUtils";
import { parseLine } from "./parseLine";
import type { ParsedLine } from "./types";

export interface ParseMessageResult {
  lines: ParsedLine[];
  summary: {
    total: number;
    logged: number;
    needsAttention: number;
  };
  /** Matches the bot's reply format from PRD 5.5, e.g. "14 logged, 0 need attention". */
  summaryText: string;
}

function needsAttention(line: ParsedLine): boolean {
  return line.kind === "error" || (line.kind === "daily" && line.needsCategory);
}

/**
 * Parses a full Telegram message, which may contain one line (a single
 * entry) or many (a bulk/backdated paste — PRD 5.5). Each line is parsed
 * independently, so one ambiguous or malformed line never blocks the rest.
 */
export function parseMessage(
  rawMessage: string,
  todayISO: string = getTodayISO()
): ParseMessageResult {
  const lines = rawMessage
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => parseLine(line, todayISO));

  const attentionCount = lines.filter(needsAttention).length;

  return {
    lines,
    summary: {
      total: lines.length,
      logged: lines.length - attentionCount,
      needsAttention: attentionCount,
    },
    summaryText: `${lines.length - attentionCount} logged, ${attentionCount} need attention`,
  };
}
