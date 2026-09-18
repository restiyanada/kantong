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
 * it actually changes, not every cycle. Cycle keys are YYYY-MM strings, so
 * string comparison matches chronological ordering. Fetches the whole
 * (small — at most one doc per month, ever) collection and picks the
 * closest match in JS, same pattern as every other db/*.ts read in this
 * codebase, rather than a Firestore document-ID range query.
 */
export async function getBudgetForCycle(cycle: string): Promise<BudgetLimits> {
  const snap = await getDb().collection(COLLECTION).get();

  let best: { id: string; data: BudgetLimits } | null = null;
  for (const doc of snap.docs) {
    if (doc.id <= cycle && (!best || doc.id > best.id)) {
      best = { id: doc.id, data: doc.data() as BudgetLimits };
    }
  }

  return best?.data ?? {};
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
