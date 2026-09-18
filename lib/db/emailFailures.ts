import { getDb } from "../firestore";

const COLLECTION = "emailParseFailures";

/**
 * Whether this Gmail message already triggered a "couldn't auto-log" alert.
 * A parse failure never creates a dailyTransactions doc, so without this,
 * a forwarder retrying the same unparseable email would re-alert forever.
 */
export async function alreadyNotifiedFailure(messageId: string): Promise<boolean> {
  const snap = await getDb().collection(COLLECTION).doc(messageId).get();
  return snap.exists;
}

export async function recordFailureNotified(messageId: string): Promise<void> {
  await getDb()
    .collection(COLLECTION)
    .doc(messageId)
    .set({ notifiedAt: new Date().toISOString() });
}
