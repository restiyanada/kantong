import { NextRequest, NextResponse } from "next/server";
import { sendDailyDigest } from "@/lib/dailyDigest";

export async function GET(request: NextRequest) {
  // Vercel Cron automatically sends this header when CRON_SECRET is set:
  // https://vercel.com/docs/cron-jobs/manage-cron-jobs#securing-cron-jobs
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await sendDailyDigest();
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error sending daily digest:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
