import { createDailyTransaction, dailyTransactionExistsForMessage } from "./db/dailyTransactions";
import { parseSourceEmail, isSkip } from "./emailParsers";

export interface IncomingEmail {
  from: string;
  subject: string;
  body: string;
  /** Gmail's unique message ID — the dedupe key (see emailParsers/types.ts). */
  messageId: string;
}

export type EmailOutcome =
  | { logged: true; category: string; amount: number }
  | { logged: false; reason: string };

/**
 * Handles one incoming bank/e-wallet email: dedupe, parse, and (if
 * everything checks out) write a new expense to the Daily pocket.
 *
 * Per PRD_Auto_Log_Bank_Emails.md section 7.3 — a parse failure (return
 * `null`) means we don't create a record at all, just report why. A `skip`
 * result (e.g. a Danamon self-transfer) is a deliberate no-op, not a
 * failure.
 */
export async function handleIncomingEmail(
  email: IncomingEmail
): Promise<EmailOutcome> {
  const alreadyLogged = await dailyTransactionExistsForMessage(email.messageId);
  if (alreadyLogged) {
    return { logged: false, reason: "duplicate (already logged)" };
  }

  const result = parseSourceEmail(email.from, email.subject, email.body);

  if (result === null) {
    return { logged: false, reason: "unrecognized sender or unparseable email" };
  }
  if (isSkip(result)) {
    return { logged: false, reason: result.reason };
  }

  await createDailyTransaction({
    type: "expense", // income auto-logging is out of scope (NG1)
    amount: result.amount,
    category: result.category,
    pending: result.pending,
    note: result.note,
    date: result.date,
    sourceMessageId: email.messageId,
  });

  return { logged: true, category: result.category, amount: result.amount };
}
