import { NextRequest, NextResponse } from "next/server";
import { handleIncomingEmail, type IncomingEmail } from "@/lib/emailHandler";

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

  try {
    const outcome = await handleIncomingEmail({ from, subject, body: emailBody, messageId });
    return NextResponse.json(outcome);
  } catch (error) {
    console.error("Error handling incoming email:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
