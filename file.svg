import { cookies } from "next/headers";
import { redirect } from "next/navigation";

/**
 * Light access gate (PRD section 3 / 8): single shared passphrase, not a
 * full auth system.
 *
 * Implemented as a plain Server Component check rather than middleware —
 * middleware/proxy runs on the Edge runtime, which hit an unrelated
 * Next.js/Turbopack bundling bug in this version. Checking inside the page
 * itself runs in the normal Node runtime and sidesteps that entirely; for
 * a single-page personal app there's no real downside to this approach.
 */
export const ACCESS_COOKIE_NAME = "kantong_access";

/** Call at the top of any Server Component that should require the passphrase. */
export async function requireAccess(): Promise<void> {
  const configuredPassword = process.env.WEB_ACCESS_PASSWORD;
  const cookieStore = await cookies();
  const cookieValue = cookieStore.get(ACCESS_COOKIE_NAME)?.value;

  const hasAccess = Boolean(configuredPassword) && cookieValue === configuredPassword;
  if (!hasAccess) {
    redirect("/login");
  }
}
