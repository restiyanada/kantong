import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

/**
 * Firebase Admin singleton. Next.js serverless functions can be reused
 * across invocations (warm starts), so we guard against re-initializing
 * the app every time this module is imported.
 */

function getAdminApp(): App {
  const existing = getApps();
  if (existing.length > 0) {
    return existing[0];
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  // Private key is stored with literal "\n" sequences in the env var;
  // they need to be converted back to real newlines.
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "Missing Firebase Admin credentials: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY"
    );
  }

  return initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
  });
}

let cachedDb: Firestore | null = null;

export function getDb(): Firestore {
  if (!cachedDb) {
    cachedDb = getFirestore(getAdminApp());
  }
  return cachedDb;
}
