import { getDb } from "../firestore";
import { encryptAmount, decryptAmount } from "../crypto";
import type { DailyTransaction, DailyTransactionDecrypted } from "@/types";

const COLLECTION = "dailyTransactions";

export async function createDailyTransaction(data: {
  type: "income" | "expense";
  amount: number;
  category: string;
  pending: boolean;
  note: string;
  date: string;
  /** Set only by the email pipeline — see DailyTransaction.sourceMessageId. */
  sourceMessageId?: string;
}): Promise<string> {
  const db = getDb();
  const doc = await db.collection(COLLECTION).add({
    type: data.type,
    amount: encryptAmount(data.amount),
    category: data.category,
    pending: data.pending,
    note: data.note,
    date: data.date,
    createdAt: new Date().toISOString(),
    ...(data.sourceMessageId ? { sourceMessageId: data.sourceMessageId } : {}),
  });
  return doc.id;
}

/**
 * Checks whether a transaction from this Gmail message was already logged —
 * used by /api/email to avoid duplicate entries on retried/re-sent emails.
 */
export async function dailyTransactionExistsForMessage(
  sourceMessageId: string
): Promise<boolean> {
  const snap = await getDb()
    .collection(COLLECTION)
    .where("sourceMessageId", "==", sourceMessageId)
    .limit(1)
    .get();
  return !snap.empty;
}

/** Sets the category on a pending transaction once a button is tapped (PRD 5.6). */
export async function resolveDailyCategory(
  id: string,
  category: string
): Promise<void> {
  await getDb().collection(COLLECTION).doc(id).update({
    category,
    pending: false,
  });
}

/** Sets the note on a transaction — used when the user replies to the "add a note?" prompt. */
export async function updateDailyTransactionNote(
  id: string,
  note: string
): Promise<void> {
  await getDb().collection(COLLECTION).doc(id).update({ note });
}

export async function getDailyTransaction(
  id: string
): Promise<DailyTransactionDecrypted | null> {
  const snap = await getDb().collection(COLLECTION).doc(id).get();
  if (!snap.exists) return null;

  const data = snap.data() as Omit<DailyTransaction, "id">;
  return { id: snap.id, ...data, amount: decryptAmount(data.amount) };
}

/** All Daily transactions, decrypted — used by the web app. */
export async function listDailyTransactions(): Promise<DailyTransactionDecrypted[]> {
  const snap = await getDb().collection(COLLECTION).get();
  return snap.docs.map((doc) => {
    const data = doc.data() as Omit<DailyTransaction, "id">;
    return { id: doc.id, ...data, amount: decryptAmount(data.amount) };
  });
}

/**
 * All pending transactions regardless of date — used by the daily digest.
 * Deliberately not scoped to "today" so a transaction never silently stops
 * appearing just because a day passed without it being resolved.
 */
export async function listPendingDailyTransactions(): Promise<
  DailyTransactionDecrypted[]
> {
  const snap = await getDb()
    .collection(COLLECTION)
    .where("pending", "==", true)
    .get();
  return snap.docs.map((doc) => {
    const data = doc.data() as Omit<DailyTransaction, "id">;
    return { id: doc.id, ...data, amount: decryptAmount(data.amount) };
  });
}
