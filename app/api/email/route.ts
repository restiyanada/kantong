import { NextRequest, NextResponse } from "next/server";
import { handleIncomingEmail, type EmailOutcome, type IncomingEmail } from "@/lib/emailHandler";
import { sendMessage } from "@/lib/telegram/telegramApi";
import { formatIDR } from "@/lib/format";

/** Pings Telegram for a real success or a genuine parse failure — never for an expected no-op (duplicate/skip). */
async function notify(outcome: EmailOutcome, email: IncomingEmail): Promise<void> {
  const chatId = Number(process.env.TELEGRAM_CHAT_ID);
  if (!chatId) return;

  const text = outcome.logged
    ? outcome.savings
      ? `📧 +${formatIDR(outcome.amount)} saved to ${outcome.category} — ${outcome.note}`
      : `📧 -${formatIDR(outcome.amount)} — ${outcome.note}${
          outcome.pending ? " (needs a category)" : ` (${outcome.category})`
        }`
    : outcome.notify
      ? `⚠️ Couldn't auto-log an email from ${email.from} — "${email.subject}"`
      : null;

  if (!text) return;

  try {
    await sendMessage(chatId, text);
  } catch (error) {
    console.error("Error sending email-log notification:", error);
  }
}

export async function POST(request: NextRequest) {
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${process.env.EMAIL_API_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { from, subject, body: emailBody, messageId } = body as Partial<IncomingEmail>;

  if (!from || !subject || !emailBody || !messageId) {
    return NextResponse.json(
      { error: "Missing required fields: from, subject, body, messageId" },
      { status: 400 }
    );
  }

  const email = { from, subject, body: emailBody, messageId };

  try {
    const outcome = await handleIncomingEmail(email);
    await notify(outcome, email);
    return NextResponse.json(outcome);
  } catch (error) {
    console.error("Error handling incoming email:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
