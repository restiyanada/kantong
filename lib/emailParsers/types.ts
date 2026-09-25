/**
 * Result of parsing a single source email. Distinguishes three outcomes,
 * per PRD_Auto_Log_Bank_Emails.md section 7.3:
 *  - a real transaction to log (category may be "Other" + pending: true if
 *    the merchant is unrecognized, or pending: false if we positively
 *    identified it as something we deliberately bucket under "Other", e.g.
 *    a Grab tip or GrabExpress delivery)
 *  - `{ skip: true }` — recognized but intentionally not logged (e.g. a
 *    Danamon self-transfer)
 *  - `null` — could not parse at all (e.g. amount unparseable); caller
 *    should not create a record
 */
export interface ParsedEmailTransaction {
  amount: number;
  category: string;
  pending: boolean;
  note: string;
  date: string; // YYYY-MM-DD
  /** Reference/booking number for logging/debugging, not used for dedupe. */
  referenceId?: string;
}

export type ParseResult =
  | ParsedEmailTransaction
  | { skip: true; reason: string }
  | null;

export function isSkip(
  result: ParseResult | ParsedSavingsDeposit
): result is { skip: true; reason: string } {
  return result !== null && "skip" in result;
}

/**
 * A deposit into a named Savings goal — a fourth outcome, distinct from
 * ParseResult's three, that only DBS's "transfer to your own account" email
 * can produce (e.g. a monthly rent fund transfer, not a no-op shuffle). Kept
 * out of the shared ParseResult union so every other parser's return type
 * (and their tests' `isSkip` narrowing) doesn't have to account for a case
 * that can never actually happen there.
 */
export interface ParsedSavingsDeposit {
  savings: true;
  amount: number;
  goal: string;
  note: string;
  date: string; // YYYY-MM-DD
  referenceId?: string;
}

export type DBSParseResult = ParseResult | ParsedSavingsDeposit;

export function isSavings(
  result: DBSParseResult
): result is ParsedSavingsDeposit {
  return result !== null && "savings" in result;
}
