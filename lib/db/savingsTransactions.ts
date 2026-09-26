import { getDb } from "../firestore";
import { encryptAmount, decryptAmount } from "../crypto";
import type { SavingsTransaction, SavingsTransactionDecrypted } from "@/types";

const COLLECTION = "savingsTransactions";

export async function createSavingsTransaction(data: {
  direction: "in" | "out";
  amount: number;
  goal: string;
  note: string;
  date: string;
  /** Set only by the email pipeline — see SavingsTransaction.sourceMessageId. */
  sourceMessageId?: string;
}): Promise<string> {
  const db = getDb();
  const doc = await db.collection(COLLECTION).add({
    direction: data.direction,
    amount: encryptAmount(data.amount),
    goal: data.goal,
    note: data.note,
    date: data.date,
    createdAt: new Date().toISOString(),
    ...(data.sourceMessageId ? { sourceMessageId: data.sourceMessageId } : {}),
  });
  return doc.id;
}

/**
 * Checks whether a savings deposit from this Gmail message was already
 * logged — used by /api/email to avoid duplicate entries on retried/re-sent
 * emails, same as dailyTransactionExistsForMessage.
 */
export async function savingsTransactionExistsForMessage(
  sourceMessageId: string
): Promise<boolean> {
  const snap = await getDb()
    .collection(COLLECTION)
    .where("sourceMessageId", "==", sourceMessageId)
    .limit(1)
    .get();
  return !snap.empty;
}

/** All Savings transactions, decrypted — used by the web app. */
export async function listSavingsTransactions(): Promise<SavingsTransactionDecrypted[]> {
  const snap = await getDb().collection(COLLECTION).get();
  return snap.docs.map((doc) => {
    const data = doc.data() as Omit<SavingsTransaction, "id">;
    return { id: doc.id, ...data, amount: decryptAmount(data.amount) };
  });
}

/**
 * Moves every transaction from one goal to another. Renaming onto a goal
 * that already exists merges the two. Firestore batches cap at 500 writes,
 * hence the chunking.
 */
export async function renameSavingsGoal(from: string, to: string): Promise<void> {
  const db = getDb();
  const snap = await db.collection(COLLECTION).where("goal", "==", from).get();
  for (let i = 0; i < snap.docs.length; i += 500) {
    const batch = db.batch();
    for (const doc of snap.docs.slice(i, i + 500)) batch.update(doc.ref, { goal: to });
    await batch.commit();
  }
}
