import type { InlineKeyboardMarkup, ForceReply } from "./telegramTypes";

function apiUrl(method: string): string {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    throw new Error("TELEGRAM_BOT_TOKEN environment variable is not set");
  }
  return `https://api.telegram.org/bot${token}/${method}`;
}

async function callTelegramApi(method: string, body: object): Promise<void> {
  const res = await fetch(apiUrl(method), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorBody = await res.text();
    console.error(`Telegram API ${method} failed: ${res.status} ${errorBody}`);
  }
}

export async function sendMessage(
  chatId: number,
  text: string,
  replyMarkup?: InlineKeyboardMarkup | ForceReply
): Promise<void> {
  await callTelegramApi("sendMessage", {
    chat_id: chatId,
    text,
    reply_markup: replyMarkup,
  });
}

/** Acknowledges a button tap (Telegram requires this within ~30s, shows a toast if `text` is set). */
export async function answerCallbackQuery(
  callbackQueryId: string,
  text?: string
): Promise<void> {
  await callTelegramApi("answerCallbackQuery", {
    callback_query_id: callbackQueryId,
    text,
  });
}

/** Removes the inline keyboard after a selection is made, so it can't be tapped twice. */
export async function editMessageReplyMarkup(
  chatId: number,
  messageId: number
): Promise<void> {
  await callTelegramApi("editMessageReplyMarkup", {
    chat_id: chatId,
    message_id: messageId,
    reply_markup: { inline_keyboard: [] },
  });
}

export async function editMessageText(
  chatId: number,
  messageId: number,
  text: string
): Promise<void> {
  await callTelegramApi("editMessageText", {
    chat_id: chatId,
    message_id: messageId,
    text,
  });
}
