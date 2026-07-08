# Kantong

Personal money tracker. Log transactions via Telegram, review them on the web.
See `kantong-prd.md` (project docs) for full product requirements.

## Stack

- Next.js (App Router) — serves both the web app and the Telegram webhook
- Firebase Firestore — data storage
- AES-256-GCM — field-level encryption for amount/principal fields
- Vercel — hosting

## Setup

1. Copy `.env.example` to `.env.local` and fill in the values:
   - `KANTONG_ENCRYPTION_KEY` — generate with
     `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`
   - `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` —
     from a Firebase service account (Firebase Console > Project Settings >
     Service Accounts > Generate new private key)
   - `TELEGRAM_BOT_TOKEN` — from [@BotFather](https://t.me/BotFather)
   - `TELEGRAM_WEBHOOK_SECRET` — any random string you pick

2. Install dependencies and run the dev server:

   ```
   npm install
   npm run dev
   ```

3. Set the same env vars in the Vercel project dashboard before deploying.

4. Once deployed, register the webhook so Telegram forwards messages to it:

   ```
   curl -X POST "https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/setWebhook" \
     -d "url=https://<your-vercel-domain>/api/telegram/webhook" \
     -d "secret_token=<TELEGRAM_WEBHOOK_SECRET>"
   ```

## Project structure

```
app/
  api/telegram/webhook/route.ts   — Telegram webhook (stub; parsing logic TBD)
  page.tsx                        — web app placeholder (views TBD)
lib/
  crypto.ts                       — AES-256-GCM encrypt/decrypt helpers
  firestore.ts                    — Firebase Admin / Firestore singleton
types/
  index.ts                        — shared types for Daily/Savings/Deposito
```

## Status

Telegram webhook is fully wired: incoming messages are parsed, written to
Firestore (amounts encrypted), and replied to — including inline category
buttons for ambiguous entries and disambiguation buttons when multiple
deposito certificates match a bank. Run `npm test` to run the test suite
(37 tests covering the parser and the webhook orchestration logic).

Not yet implemented: the web app views and charts (`app/page.tsx` is still
a placeholder).
