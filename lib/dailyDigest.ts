import { listPendingDailyTransactions } from "./db/dailyTransactions";
import { sendMessage } from "./telegram/telegramApi";
import { buildCategoryKeyboard } from "./telegram/handleUpdate";
import { formatIDR } from "./format";

const MAX_SHOWN = 10; // PRD_Auto_Log_Bank_Emails.md section 9.2

export interface DigestResult {
  sent: number;
  overflow: number;
  /** True on a "silent day" — no pending transactions, nothing sent. */
  skipped: boolean;
}

/**
 * Sends the daily digest: an intro line, then one message per pending
 * transaction with tappable category buttons underneath (reusing the same
 * `dc:<id>:<category>` keyboard/callback the bot already uses for
 * ambiguous Telegram-typed entries — no new button-handling code needed).
 *
 * Queries ALL pending transactions regardless of date (not just today's),
 * per the "don't let anything silently fall through the cracks" decision —
 * a transaction keeps reappearing every night until it's actually resolved.
 */
export async function sendDailyDigest(): Promise<DigestResult> {
  const chatId = Number(process.env.TELEGRAM_CHAT_ID);
  if (!chatId) {
    throw new Error("TELEGRAM_CHAT_ID environment variable is not set");
  }

  const pending = await listPendingDailyTransactions();
  if (pending.length === 0) {
    return { sent: 0, overflow: 0, skipped: true }; // silent day
  }

  const toShow = pending.slice(0, MAX_SHOWN);
  const overflow = pending.length - toShow.length;

  await sendMessage(
    chatId,
    `📬 ${pending.length} transaction${pending.length === 1 ? "" : "s"} need attention`
  );

  for (const tx of toShow) {
    await sendMessage(
      chatId,
      `${formatIDR(tx.amount)}${tx.note ? ` — ${tx.note}` : ""}`,
      buildCategoryKeyboard(tx.id, tx.type)
    );
  }

  if (overflow > 0) {
    await sendMessage(chatId, `…and ${overflow} more on web app`);
  }

  return { sent: toShow.length, overflow, skipped: false };
}
