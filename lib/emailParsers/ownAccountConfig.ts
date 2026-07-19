/**
 * Self-transfer detection needs to know the user's own name and any
 * nicknames/aliases their own accounts are saved under at other banks
 * (e.g. DBS shows "bca uwi" instead of a name for a BCA destination).
 *
 * Both are read from environment variables rather than hardcoded, since
 * they're PII that shouldn't be committed to the repo (see
 * PRD_Auto_Log_Bank_Emails.md section 7.4).
 *
 * Required env vars (Vercel dashboard + local .env.local, gitignored):
 *   OWN_NAME             = full name as it appears in "Nama Penerima" fields
 *   OWN_ACCOUNT_ALIASES  = comma-separated nicknames, e.g. "uwi"
 */

export function getOwnNamePattern(): RegExp | null {
  const name = process.env.OWN_NAME;
  if (!name) return null;
  return new RegExp(name, "i");
}

export function getOwnAccountAliases(): string[] {
  return (process.env.OWN_ACCOUNT_ALIASES ?? "")
    .split(",")
    .map((alias) => alias.trim().toLowerCase())
    .filter(Boolean);
}
