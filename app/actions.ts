"use server";

import { revalidatePath } from "next/cache";
import { requireAccess } from "@/lib/accessGate";
import { updateDailyTransaction } from "@/lib/db/dailyTransactions";
import { renameSavingsGoal as renameGoalInDb } from "@/lib/db/savingsTransactions";

/** Web edit form for a logged Daily transaction — amount/category/note/date only. */
export async function editDailyTransaction(id: string, formData: FormData): Promise<void> {
  await requireAccess();

  await updateDailyTransaction(id, {
    amount: Number(formData.get("amount")),
    category: String(formData.get("category")),
    note: String(formData.get("note") ?? ""),
    date: String(formData.get("date")),
  });

  revalidatePath("/");
}

/** Web rename sheet for a Savings goal. Renaming onto an existing goal merges them. */
export async function renameSavingsGoal(from: string, formData: FormData): Promise<void> {
  await requireAccess();

  const to = String(formData.get("to") ?? "").trim();
  if (!to || to === from) return;

  await renameGoalInDb(from, to);
  revalidatePath("/");
}
