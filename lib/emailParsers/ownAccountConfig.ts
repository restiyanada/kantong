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
 *   DBS_SAVINGS_ACCOUNTS = comma-separated "account suffix:goal name" pairs,
 *                          e.g. "6483:Bayar Kosan,3538:Kuliah" — some
 *                          "transfer to your own DBS account" emails are
 *                          actually deposits into a named savings goal
 *                          (e.g. a monthly rent fund), not a no-op shuffle.
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

/** Looks up the savings goal for a destination account suffix, or null if it's not a tracked savings account. */
export function getDbsSavingsGoal(accountSuffix: string): string | null {
  const pairs = (process.env.DBS_SAVINGS_ACCOUNTS ?? "").split(",");
  for (const pair of pairs) {
    const [suffix, goal] = pair.split(":").map((part) => part.trim());
    if (suffix && goal && accountSuffix.endsWith(suffix)) return goal;
  }
  return null;
}

