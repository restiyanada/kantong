/**
 * Shared types for Kantong's three pockets.
 * Mirrors the conceptual data model in the PRD (section 7).
 *
 * Note: `amount` / `principal` are the *encrypted* string form as stored in
 * Firestore. Decrypted numeric values are represented by the `*Decrypted`
 * variants, used once data has passed through lib/crypto.ts.
 */

export type Pocket = "daily" | "savings" | "deposito";

export const DAILY_EXPENSE_CATEGORIES = [
  "Food",
  "Transport",
  "Bills",
  "Shopping",
  "Health",
  "Entertainment",
  "Other",
] as const;

export const DAILY_INCOME_CATEGORIES = ["Salary", "Other Income"] as const;

export type DailyExpenseCategory = (typeof DAILY_EXPENSE_CATEGORIES)[number];
export type DailyIncomeCategory = (typeof DAILY_INCOME_CATEGORIES)[number];
export type DailyCategory = DailyExpenseCategory | DailyIncomeCategory;

/** Daily pocket transaction, as stored in Firestore. */
export interface DailyTransaction {
  id: string;
  type: "income" | "expense";
  amount: string; // encrypted
  /** Empty string while `pending` is true (category not yet picked). */
  category: DailyCategory | string;
  /** True until the person taps a category button (PRD 5.6). */
  pending: boolean;
  note: string;
  date: string; // YYYY-MM-DD
  createdAt: string; // ISO timestamp
  /**
   * Gmail message ID, present only for transactions created by the
   * auto-log-from-email pipeline. Used to dedupe against retries/re-sent
   * emails — absent (undefined) for Telegram-created entries.
   */
  sourceMessageId?: string;
}

export interface DailyTransactionDecrypted
  extends Omit<DailyTransaction, "amount"> {
  amount: number;
}

/** Savings pocket transfer, as stored in Firestore. */
export interface SavingsTransaction {
  id: string;
  direction: "in" | "out";
  amount: string; // encrypted
  goal: string; // e.g. "Holiday", "Emergency", "General"
  note: string;
  date: string; // YYYY-MM-DD
  createdAt: string; // ISO timestamp
}

export interface SavingsTransactionDecrypted
  extends Omit<SavingsTransaction, "amount"> {
  amount: number;
}

export type DepositoStatus = "active" | "matured" | "closed";

/** Deposito certificate, as stored in Firestore. */
export interface DepositoCertificate {
  id: string;
  bank: string;
  principal: string; // encrypted
  openedDate: string; // YYYY-MM-DD
  maturityDate: string; // YYYY-MM-DD
  termMonths: number;
  status: DepositoStatus;
  /** Only set once status is "closed" — the actual withdrawal date (PRD 5.4 cairkan). */
  closedDate?: string; // YYYY-MM-DD
  createdAt: string; // ISO timestamp
}

export interface DepositoCertificateDecrypted
  extends Omit<DepositoCertificate, "principal"> {
  principal: number;
}
