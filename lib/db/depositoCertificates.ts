import { getDb } from "../firestore";
import { encryptAmount, decryptAmount } from "../crypto";
import { addMonths } from "../telegram/dateUtils";
import type {
  DepositoCertificate,
  DepositoCertificateDecrypted,
} from "@/types";

const COLLECTION = "depositoCertificates";

export async function createCertificate(data: {
  bank: string;
  principal: number;
  openedDate: string;
  maturityDate: string;
  termMonths: number;
}): Promise<string> {
  const db = getDb();
  const doc = await db.collection(COLLECTION).add({
    bank: data.bank,
    principal: encryptAmount(data.principal),
    openedDate: data.openedDate,
    maturityDate: data.maturityDate,
    termMonths: data.termMonths,
    status: "active",
    createdAt: new Date().toISOString(),
  });
  return doc.id;
}

/**
 * Certificates at a bank that are still open. Note: `status` is only
 * flipped away from "active" by an explicit cairkan/perpanjang action —
 * maturity itself is date-derived (PRD 5.4), not a background job — so
 * this can include certificates past their maturity date.
 */
export async function findActiveCertificatesByBank(
  bank: string
): Promise<DepositoCertificateDecrypted[]> {
  const snap = await getDb()
    .collection(COLLECTION)
    .where("bank", "==", bank)
    .where("status", "==", "active")
    .get();

  return snap.docs.map((doc) => {
    const data = doc.data() as Omit<DepositoCertificate, "id">;
    return { id: doc.id, ...data, principal: decryptAmount(data.principal) };
  });
}

export async function closeCertificate(id: string, closedDate: string): Promise<void> {
  await getDb().collection(COLLECTION).doc(id).update({ status: "closed", closedDate });
}

/** All certificates regardless of status, decrypted — used by the web app. */
export async function listCertificates(): Promise<DepositoCertificateDecrypted[]> {
  const snap = await getDb().collection(COLLECTION).get();
  return snap.docs.map((doc) => {
    const data = doc.data() as Omit<DepositoCertificate, "id">;
    return { id: doc.id, ...data, principal: decryptAmount(data.principal) };
  });
}

/** Rolls a certificate into a new term starting today (no interest modeled). */
export async function renewCertificate(
  id: string,
  termMonths: number,
  todayISO: string
): Promise<void> {
  await getDb()
    .collection(COLLECTION)
    .doc(id)
    .update({
      openedDate: todayISO,
      maturityDate: addMonths(todayISO, termMonths),
      termMonths,
    });
}
