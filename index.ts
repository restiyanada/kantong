import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

/**
 * Field-level encryption for monetary amounts (AES-256-GCM).
 *
 * Only `amount` / `principal` fields are encrypted — category, note, date,
 * bank, and status stay plaintext so they remain searchable/aggregatable
 * (see PRD section 8).
 *
 * Key source: single static key from the KANTONG_ENCRYPTION_KEY env var,
 * base64-encoded, decoding to exactly 32 bytes. Generate one with:
 *   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
 */

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // recommended IV length for GCM

let cachedKey: Buffer | null = null;

function getKey(): Buffer {
  if (cachedKey) return cachedKey;

  const raw = process.env.KANTONG_ENCRYPTION_KEY;
  if (!raw) {
    throw new Error("KANTONG_ENCRYPTION_KEY environment variable is not set");
  }

  const key = Buffer.from(raw, "base64");
  if (key.length !== 32) {
    throw new Error(
      `KANTONG_ENCRYPTION_KEY must decode to 32 bytes, got ${key.length}`
    );
  }

  cachedKey = key;
  return key;
}

/**
 * Encrypts a plaintext string. Stored format is a single string:
 *   base64(iv) + "." + base64(authTag) + "." + base64(ciphertext)
 */
export function encrypt(plaintext: string): string {
  const key = getKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  const ciphertext = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return [
    iv.toString("base64"),
    authTag.toString("base64"),
    ciphertext.toString("base64"),
  ].join(".");
}

/** Decrypts a string produced by `encrypt`. */
export function decrypt(encrypted: string): string {
  const key = getKey();
  const parts = encrypted.split(".");
  if (parts.length !== 3) {
    throw new Error("Malformed encrypted value");
  }

  const [ivB64, authTagB64, ciphertextB64] = parts;
  const iv = Buffer.from(ivB64, "base64");
  const authTag = Buffer.from(authTagB64, "base64");
  const ciphertext = Buffer.from(ciphertextB64, "base64");

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  const plaintext = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);

  return plaintext.toString("utf8");
}

/** Convenience wrapper for encrypting a monetary amount (stored as IDR integer). */
export function encryptAmount(amount: number): string {
  return encrypt(String(amount));
}

/** Convenience wrapper for decrypting a monetary amount back into a number. */
export function decryptAmount(encrypted: string): number {
  return Number(decrypt(encrypted));
}
