import { parseBCA } from "./bca";
import { parseDanamon } from "./danamon";
import { parseBCACreditCard } from "./bcaCreditCard";
import { parseDBS } from "./dbs";
import { parseGrab } from "./grab";
import type { DBSParseResult } from "./types";

export type { ParseResult, ParsedEmailTransaction, ParsedSavingsDeposit, DBSParseResult } from "./types";
export { isSkip, isSavings } from "./types";

/**
 * Routes an email to the right source parser based on sender address.
 * Returns null if the sender isn't a recognized source at all (distinct
 * from a recognized source that failed to parse — see parser docstrings).
 * Return type is DBSParseResult (a superset of ParseResult) since DBS is the
 * only source that can produce a Savings-goal deposit.
 */
export function parseSourceEmail(
  from: string,
  subject: string,
  body: string
): DBSParseResult {
  const sender = from.toLowerCase();

  if (sender.includes("klikbca.com")) return parseBCACreditCard(body);
  if (sender.includes("bca.co.id")) return parseBCA(body);
  if (sender.includes("danamon.co.id")) return parseDanamon(subject, body);
  if (sender.includes("dbs.com")) return parseDBS(subject, body);
  if (sender.includes("grab.com")) return parseGrab(subject, body);

  return null;
}
