import { NextRequest, NextResponse } from "next/server";
import { ACCESS_COOKIE_NAME } from "@/proxy";

export async function POST(request: NextRequest) {
  const { password } = await request.json();
  const configuredPassword = process.env.WEB_ACCESS_PASSWORD;

  if (!configuredPassword || password !== configuredPassword) {
    return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(ACCESS_COOKIE_NAME, password, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: "/",
  });
  return response;
}
