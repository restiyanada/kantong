import { NextRequest, NextResponse } from "next/server";
import { handleUpdate } from "@/lib/telegram/handleUpdate";
import type { TelegramUpdate } from "@/lib/telegram/telegramTypes";

export async function POST(request: NextRequest) {
  const secret = request.headers.get("x-telegram-bot-api-secret-token");
  if (secret !== process.env.TELEGRAM_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const update: TelegramUpdate = await request.json();

  try {
    await handleUpdate(update);
  } catch (error) {
    // Log and still return 200 — returning an error status would make
    // Telegram retry the same update repeatedly.
    console.error("Error handling Telegram update:", error);
  }

  return NextResponse.json({ ok: true });
}
