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
  category: DailyCategory | string;
  note: string;
  date: string; // YYYY-MM-DD
  createdAt: string; // ISO timestamp
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
  createdAt: string; // ISO timestamp
}

export interface DepositoCertificateDecrypted
  extends Omit<DepositoCertificate, "principal"> {
  principal: number;
}
