import { DAILY_EXPENSE_CATEGORIES, DAILY_INCOME_CATEGORIES } from "@/types";
import { formatIDR } from "../format";
import { createDailyTransaction, resolveDailyCategory } from "../db/dailyTransactions";
import { createSavingsTransaction } from "../db/savingsTransactions";
import {
  createCertificate,
  findActiveCertificatesByBank,
  closeCertificate,
  renewCertificate,
} from "../db/depositoCertificates";
import { getTodayISO } from "./dateUtils";
import { parseMessage } from "./parseMessage";
import type { ParsedLine } from "./types";
import {
  sendMessage,
  answerCallbackQuery,
  editMessageText,
} from "./telegramApi";
import type {
  TelegramUpdate,
  TelegramMessage,
  TelegramCallbackQuery,
  InlineKeyboardMarkup,
} from "./telegramTypes";

export async function handleUpdate(update: TelegramUpdate): Promise<void> {
  if (update.message) {
    await handleMessage(update.message);
  } else if (update.callback_query) {
    await handleCallbackQuery(update.callback_query);
  }
}

interface LineOutcome {
  status: "logged" | "attention";
  /** Human-readable detail; shown directly for single-line messages, or
   * alongside the summary count for bulk pastes (attention-only). */
  detail?: string;
}

async function handleMessage(message: TelegramMessage): Promise<void> {
  const chatId = message.chat.id;
  const text = message.text;

  if (!text) {
    await sendMessage(chatId, "Send a text message to log a transaction.");
    return;
  }

  const todayISO = getTodayISO();
  const result = parseMessage(text, todayISO);
  const isBulk = result.lines.length > 1;
  const deferredPrompts: Array<() => Promise<void>> = [];

  const outcomes: LineOutcome[] = [];
  for (const line of result.lines) {
    outcomes.push(await processLine(line, chatId, todayISO, deferredPrompts));
  }

  const loggedCount = outcomes.filter((o) => o.status === "logged").length;
  const attentionCount = outcomes.length - loggedCount;

  if (isBulk) {
    const details = outcomes
      .filter((o) => o.status === "attention" && o.detail)
      .map((o) => `⚠️ ${o.detail}`);
    await sendMessage(
      chatId,
      [`${loggedCount} logged, ${attentionCount} need attention`, ...details].join("\n")
    );
  } else if (outcomes[0]?.detail) {
    const prefix = outcomes[0].status === "logged" ? "✅" : "⚠️";
    await sendMessage(chatId, `${prefix} ${outcomes[0].detail}`);
  }

  for (const prompt of deferredPrompts) {
    await prompt();
  }
}

/** Performs the Firestore write (if any) for one parsed line and reports the outcome. */
async function processLine(
  line: ParsedLine,
  chatId: number,
  todayISO: string,
  deferredPrompts: Array<() => Promise<void>>
): Promise<LineOutcome> {
  switch (line.kind) {
    case "daily": {
      if (line.needsCategory) {
        const id = await createDailyTransaction({
          type: line.type,
          amount: line.amount,
          category: "",
          pending: true,
          note: line.note,
          date: line.date,
        });
        deferredPrompts.push(() =>
          sendMessage(
            chatId,
            `Which category? ${formatIDR(line.amount)}${line.note ? ` — "${line.note}"` : ""}`,
            buildCategoryKeyboard(id, line.type)
          )
        );
        return { status: "attention" };
      }

      // `category` is guaranteed non-null here since needsCategory is false.
      await createDailyTransaction({
        type: line.type,
        amount: line.amount,
        category: line.category as string,
        pending: false,
        note: line.note,
        date: line.date,
      });
      return {
        status: "logged",
        detail: `${line.type === "income" ? "+" : "-"}${formatIDR(line.amount)} — ${line.category}${line.note ? ` (${line.note})` : ""}`,
      };
    }

    case "savings": {
      await createSavingsTransaction({
        direction: line.direction,
        amount: line.amount,
        goal: line.goal,
        note: line.note,
        date: line.date,
      });
      return {
        status: "logged",
        detail: `Savings ${line.direction === "in" ? "+" : "-"}${formatIDR(line.amount)} — ${line.goal}${line.note ? ` (${line.note})` : ""}`,
      };
    }

    case "deposito_open": {
      await createCertificate({
        bank: line.bank,
        principal: line.principal,
        openedDate: line.openedDate,
        maturityDate: line.maturityDate,
        termMonths: line.termMonths,
      });
      return {
        status: "logged",
        detail: `New deposito at ${line.bank}: ${formatIDR(line.principal)}, matures ${line.maturityDate}`,
      };
    }

    case "deposito_cairkan": {
      const candidates = await findActiveCertificatesByBank(line.bank);
      if (candidates.length === 0) {
        return { status: "attention", detail: `No active deposito found at ${line.bank}.` };
      }
      if (candidates.length === 1) {
        await closeCertificate(candidates[0].id, line.closedDate);
        return {
          status: "logged",
          detail: `Closed deposito at ${line.bank}: ${formatIDR(candidates[0].principal)}`,
        };
      }
      deferredPrompts.push(() =>
        sendMessage(
          chatId,
          `Multiple deposito at ${line.bank} — which one to close?`,
          buildCertificateKeyboard(candidates, "dep_c", undefined, line.closedDate)
        )
      );
      return { status: "attention" };
    }

    case "deposito_perpanjang": {
      const candidates = await findActiveCertificatesByBank(line.bank);
      if (candidates.length === 0) {
        return { status: "attention", detail: `No active deposito found at ${line.bank}.` };
      }
      if (candidates.length === 1) {
        await renewCertificate(candidates[0].id, line.termMonths, todayISO);
        return {
          status: "logged",
          detail: `Renewed deposito at ${line.bank} for ${line.termMonths} months`,
        };
      }
      deferredPrompts.push(() =>
        sendMessage(
          chatId,
          `Multiple deposito at ${line.bank} — which one to renew for ${line.termMonths} months?`,
          buildCertificateKeyboard(candidates, "dep_p", line.termMonths)
        )
      );
      return { status: "attention" };
    }

    case "error": {
      return { status: "attention", detail: `"${line.rawLine}" — ${line.message}` };
    }
  }
}

export function buildCategoryKeyboard(
  dailyTransactionId: string,
  type: "income" | "expense"
): InlineKeyboardMarkup {
  const categories: readonly string[] =
    type === "income" ? DAILY_INCOME_CATEGORIES : DAILY_EXPENSE_CATEGORIES;

  const buttons = categories.map((category) => ({
    text: category,
    callback_data: `dc:${dailyTransactionId}:${category}`,
  }));

  // Two buttons per row.
  const rows = [];
  for (let i = 0; i < buttons.length; i += 2) {
    rows.push(buttons.slice(i, i + 2));
  }
  return { inline_keyboard: rows };
}

function buildCertificateKeyboard(
  candidates: Array<{ id: string; bank: string; openedDate: string; principal: number }>,
  actionPrefix: "dep_c" | "dep_p",
  termMonths?: number,
  closedDate?: string
): InlineKeyboardMarkup {
  return {
    inline_keyboard: candidates.map((c) => [
      {
        text: `${c.bank} • opened ${c.openedDate} • ${formatIDR(c.principal)}`,
        callback_data:
          actionPrefix === "dep_p"
            ? `dep_p:${c.id}:${termMonths}`
            : `dep_c:${c.id}:${closedDate}`,
      },
    ]),
  };
}

async function handleCallbackQuery(callbackQuery: TelegramCallbackQuery): Promise<void> {
  const { data, message } = callbackQuery;

  if (!data || !message) {
    await answerCallbackQuery(callbackQuery.id);
    return;
  }

  const chatId = message.chat.id;
  const messageId = message.message_id;
  const [action, ...rest] = data.split(":");

  if (action === "dc") {
    const [id, category] = rest;
    await resolveDailyCategory(id, category);
    await answerCallbackQuery(callbackQuery.id, `Saved: ${category}`);
    await editMessageText(chatId, messageId, `✅ Category set: ${category}`);
    return;
  }

  if (action === "dep_c") {
    const [id, closedDate] = rest;
    await closeCertificate(id, closedDate);
    await answerCallbackQuery(callbackQuery.id, "Closed");
    await editMessageText(chatId, messageId, "✅ Deposito closed");
    return;
  }

  if (action === "dep_p") {
    const [id, termStr] = rest;
    const termMonths = Number(termStr);
    await renewCertificate(id, termMonths, getTodayISO());
    await answerCallbackQuery(callbackQuery.id, "Renewed");
    await editMessageText(chatId, messageId, `✅ Deposito renewed for ${termMonths} months`);
    return;
  }

  await answerCallbackQuery(callbackQuery.id, "Unknown action");
}
