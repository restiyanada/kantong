/**
 * One-off cleanup: removes daily transactions that were incorrectly
 * auto-logged from bank emails dated BEFORE the historical-import start
 * date (June 25, 2026 — kantong-prd.md section 2), caused by a bug where
 * Gmail's thread-level "after:" search let old messages (some as far back
 * as Feb 2025) slip through via BCA's shared-subject-line threading.
 *
 * SAFE BY DESIGN:
 *  - Only ever touches documents that have `sourceMessageId` set — that
 *    field is ONLY written by the email pipeline (lib/db/dailyTransactions.ts
 *    createDailyTransaction). Anything entered via Telegram never has it,
 *    so this script can never delete a manually-entered transaction.
 *  - Defaults to DRY RUN — prints what it would delete without touching
 *    anything. Pass --confirm to actually delete.
 *
 * USAGE (from your Codespace terminal, repo root):
 *   npx tsx scripts/cleanup-pre-import-email-transactions.ts
 *     -> dry run, just lists what would be deleted
 *   npx tsx scripts/cleanup-pre-import-email-transactions.ts --confirm
 *     -> actually deletes them
 */
import { getDb } from "../lib/firestore";

const CUTOFF_DATE = "2026-06-25"; // kantong-prd.md: historical import starts here
const COLLECTION = "dailyTransactions";

async function main() {
  const confirmed = process.argv.includes("--confirm");

  const snap = await getDb().collection(COLLECTION).get();

  const toDelete = snap.docs.filter((doc) => {
    const data = doc.data();
    return (
      typeof data.sourceMessageId === "string" &&
      typeof data.date === "string" &&
      data.date < CUTOFF_DATE
    );
  });

  if (toDelete.length === 0) {
    console.log("Nothing to clean up — no pre-cutoff email-sourced transactions found.");
    return;
  }

  console.log(
    `Found ${toDelete.length} email-sourced transaction(s) dated before ${CUTOFF_DATE}:\n`
  );
  for (const doc of toDelete) {
    const d = doc.data();
    console.log(
      `  ${doc.id}  ${d.date}  ${d.category}  "${d.note}"`
    );
  }

  if (!confirmed) {
    console.log(
      `\nDry run only — nothing deleted. Re-run with --confirm to actually delete these ${toDelete.length} document(s).`
    );
    return;
  }

  const batchSize = 400; // stay under Firestore's 500-write batch limit
  for (let i = 0; i < toDelete.length; i += batchSize) {
    const batch = getDb().batch();
    for (const doc of toDelete.slice(i, i + batchSize)) {
      batch.delete(doc.ref);
    }
    await batch.commit();
  }

  console.log(`\nDeleted ${toDelete.length} document(s).`);
}

main().catch((err) => {
  console.error("Cleanup script failed:", err);
  process.exit(1);
});
