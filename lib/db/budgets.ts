import { FieldPath } from "firebase-admin/firestore";
import { getDb } from "../firestore";

const COLLECTION = "budgets";

/**
 * Category -> monthly limit (plain IDR integer, not encrypted — a budget
 * cap isn't a real transaction amount, see lib/crypto.ts's scope).
 */
export type BudgetLimits = Record<string, number>;

/**
 * Reads the budget for a cycle, carrying forward from the most recent
 * earlier cycle that has one — so a limit only needs to be set again when
 * it actually changes, not every cycle. Cycle keys are YYYY-MM strings,
 * so lexicographic ordering matches chronological ordering.
 */
export async function getBudgetForCycle(cycle: string): Promise<BudgetLimits> {
  const doc = await getDb().collection(COLLECTION).doc(cycle).get();
  if (doc.exists) return doc.data() as BudgetLimits;

  const snap = await getDb()
    .collection(COLLECTION)
    .where(FieldPath.documentId(), "<", cycle)
    .orderBy(FieldPath.documentId(), "desc")
    .limit(1)
    .get();

  return snap.empty ? {} : (snap.docs[0].data() as BudgetLimits);
}

/** Sets one category's limit for a cycle — merges, leaving other categories untouched. */
export async function setBudgetLimit(
  cycle: string,
  category: string,
  limit: number
): Promise<void> {
  await getDb()
    .collection(COLLECTION)
    .doc(cycle)
    .set({ [category]: limit }, { merge: true });
}
