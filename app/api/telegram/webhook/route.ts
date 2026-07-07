import { NextRequest, NextResponse } from "next/server";

/**
 * Telegram webhook endpoint.
 *
 * This is a plumbing-only stub for now: it verifies the request actually
 * came from Telegram and acknowledges it. The free-text parsing logic for
 * Daily/Income/Savings/Deposito/backdated formats (PRD section 5) is a
 * separate stage — it will replace the TODO below.
 */
export async function POST(request: NextRequest) {
  const secret = request.headers.get("x-telegram-bot-api-secret-token");
  if (secret !== process.env.TELEGRAM_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const update = await request.json();
  const text: string | undefined = update?.message?.text;

  // TODO(stage 2): parse `text` into a Daily/Savings/Deposito entry,
  // write it to Firestore (amounts via lib/crypto.ts), and reply via the
  // Telegram Bot API. For now, just acknowledge receipt so Telegram
  // doesn't retry.
  console.log("Received Telegram message:", text);

  return NextResponse.json({ ok: true });
}
