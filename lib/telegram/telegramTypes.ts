export interface TelegramChat {
  id: number;
}

export interface TelegramMessage {
  message_id: number;
  chat: TelegramChat;
  text?: string;
  /** Present when this message is a reply to another — used to tell a
   * free-text note reply apart from a new transaction to log. */
  reply_to_message?: TelegramMessage;
}

export interface TelegramCallbackQuery {
  id: string;
  data?: string;
  message?: TelegramMessage;
}

export interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
  callback_query?: TelegramCallbackQuery;
}

export interface InlineKeyboardButton {
  text: string;
  callback_data: string;
}

export type InlineKeyboardMarkup = {
  inline_keyboard: InlineKeyboardButton[][];
};

/** Prompts the user's Telegram client to reply directly to this message. */
export interface ForceReply {
  force_reply: true;
}
