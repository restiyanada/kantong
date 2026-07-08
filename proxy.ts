import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Light access gate (PRD section 3 / 8): single shared passphrase, not a
 * full auth system. Everything except the login page, its API route, and
 * the Telegram webhook (which is verified separately via a secret token)
 * requires the access cookie.
 */
export const ACCESS_COOKIE_NAME = "kantong_access";

export function proxy(request: NextRequest) {
  const configuredPassword = process.env.WEB_ACCESS_PASSWORD;
  const cookieValue = request.cookies.get(ACCESS_COOKIE_NAME)?.value;
  const hasAccess = Boolean(configuredPassword) && cookieValue === configuredPassword;

  if (!hasAccess) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api/telegram/webhook|login|api/login|_next/static|_next/image|favicon.ico).*)"],
};
