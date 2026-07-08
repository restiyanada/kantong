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
}): Promise<string> {
  const db = getDb();
  const doc = await db.collection(COLLECTION).add({
    direction: data.direction,
    amount: encryptAmount(data.amount),
    goal: data.goal,
    note: data.note,
    date: data.date,
    createdAt: new Date().toISOString(),
  });
  return doc.id;
}

/** All Savings transactions, decrypted — used by the web app. */
export async function listSavingsTransactions(): Promise<SavingsTransactionDecrypted[]> {
  const snap = await getDb().collection(COLLECTION).get();
  return snap.docs.map((doc) => {
    const data = doc.data() as Omit<SavingsTransaction, "id">;
    return { id: doc.id, ...data, amount: decryptAmount(data.amount) };
  });
}
