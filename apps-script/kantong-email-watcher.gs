/**
 * Kantong — Auto-Log Bank Emails: Gmail watcher.
 *
 * Deliberately "dumb" — does NOT parse amounts/merchants/categories itself.
 * It just finds unprocessed emails from known senders and forwards the raw
 * from/subject/body/messageId to /api/email, which does all real parsing
 * (see PRD_Auto_Log_Bank_Emails.md and lib/emailParsers/ in the main repo).
 * Keeping parsing out of Apps Script means it's tested with real vitest
 * fixtures instead of debugged inside the Apps Script editor.
 *
 * SETUP (one-time, all in the browser, no local terminal needed):
 *   1. Go to script.google.com > New project, paste this whole file in.
 *   2. Project Settings (gear icon) > Script Properties > add two:
 *        KANTONG_API_URL    = https://<your-vercel-app>.vercel.app/api/email
 *        KANTONG_API_SECRET = <same value as EMAIL_API_SECRET in Vercel>
 *   3. Select `createTimeTrigger` from the function dropdown at the top,
 *      click Run. Google will prompt for permission the first time
 *      (Gmail read/modify + external requests) — approve it.
 *      This both runs the watcher once immediately AND sets up the
 *      recurring 5-minute trigger, so no separate "add trigger" step.
 *   4. Check Executions (clock icon, left sidebar) to confirm it ran
 *      without errors, then check Firestore / the web app for the result.
 *
 * No manual Gmail filter or label needs to be created — the script creates
 * and manages its own "kantong-processed" label automatically.
 */

const PROCESSED_LABEL_NAME = "kantong-processed";
const KNOWN_SENDERS = [
  "bca@bca.co.id",
  "kartukreditbca@klikbca.com", // BCA credit card transaction notifications
  "dbank.app@danamon.co.id",
  "dbsindonesia@1bank.dbs.com",
  "digibankid@dbs.com", // newer DBS "digibank" sender, separate from the above
  "no-reply@grab.com",
];
const MAX_THREADS_PER_RUN = 50;
// Only look at emails from the historical-import start date onward
// (kantong-prd.md section 2: "Import ~2 weeks of historical data since
// June 25"). Without this, a fresh Gmail search with no date bound walks
// the entire mailbox history for these senders.
const SEARCH_AFTER_DATE = "2026/06/25";
const SEARCH_AFTER_CUTOFF = new Date("2026-06-25T00:00:00+07:00"); // WIB

/** Entry point — run manually once, then on the recurring trigger. */
function processKantongEmails() {
  const props = PropertiesService.getScriptProperties();
  const apiUrl = props.getProperty("KANTONG_API_URL");
  const apiSecret = props.getProperty("KANTONG_API_SECRET");

  if (!apiUrl || !apiSecret) {
    Logger.log(
      "Missing KANTONG_API_URL or KANTONG_API_SECRET script property — set both under Project Settings > Script Properties."
    );
    return;
  }

  const processedLabel = getOrCreateProcessedLabel();
  const senderQuery = KNOWN_SENDERS.map((s) => `from:${s}`).join(" OR ");
  const query = `(${senderQuery}) -label:${PROCESSED_LABEL_NAME} after:${SEARCH_AFTER_DATE}`;

  const threads = GmailApp.search(query, 0, MAX_THREADS_PER_RUN);
  Logger.log(`Found ${threads.length} unprocessed thread(s).`);

  for (const thread of threads) {
    const allOk = processThread(thread, apiUrl, apiSecret);
    // Only mark as processed if every message in the thread went through
    // cleanly — a 5xx/network error should be retried on the next run,
    // not silently skipped forever.
    if (allOk) {
      thread.addLabel(processedLabel);
    }
  }
}

/** Forwards every message in a thread; returns false if any should be retried. */
function processThread(thread, apiUrl, apiSecret) {
  let allOk = true;

  for (const message of thread.getMessages()) {
    // Gmail's "after:" search operator matches if ANY message in a thread
    // is recent enough, then returns the WHOLE thread — including much
    // older messages. Senders like BCA reuse the same subject line
    // ("Internet Transaction Journal") for every transaction ever, so
    // Gmail threads months of unrelated transactions together. Without
    // this per-message check, old messages sneak past the query-level
    // date filter and get sent to /api/email anyway.
    if (message.getDate() < SEARCH_AFTER_CUTOFF) {
      Logger.log(
        `[skip-old] ${message.getId()}: dated ${message.getDate()}, before cutoff`
      );
      continue;
    }

    const payload = {
      from: message.getFrom(),
      subject: message.getSubject(),
      body: message.getPlainBody(),
      messageId: message.getId(),
    };

    // TEMPORARY DEBUG — remove once the DBS QRIS parsing issue is fixed.
    if (payload.subject.includes("QRIS")) {
      Logger.log(`RAW BODY (${payload.messageId}):\n${payload.body}`);
    }

    try {
      const response = UrlFetchApp.fetch(apiUrl, {
        method: "post",
        contentType: "application/json",
        headers: { Authorization: `Bearer ${apiSecret}` },
        payload: JSON.stringify(payload),
        muteHttpExceptions: true,
      });

      const status = response.getResponseCode();
      const responseText = response.getContentText();

      if (status >= 500) {
        // Transient/server-side failure — leave unlabeled so it's retried.
        allOk = false;
        Logger.log(`[retry] ${payload.messageId}: HTTP ${status} — ${responseText}`);
      } else {
        // 200 (logged, or a deliberate skip/duplicate) or 400/401 (a
        // payload/auth problem that won't fix itself on retry either) —
        // both are "done", so this message won't be looked at again.
        Logger.log(`[done] ${payload.messageId}: HTTP ${status} — ${responseText}`);
      }
    } catch (err) {
      allOk = false;
      Logger.log(`[retry] ${payload.messageId}: request failed — ${err}`);
    }
  }

  return allOk;
}

function getOrCreateProcessedLabel() {
  return (
    GmailApp.getUserLabelByName(PROCESSED_LABEL_NAME) ||
    GmailApp.createLabel(PROCESSED_LABEL_NAME)
  );
}

/**
 * Run this once from the Apps Script editor to set up the recurring
 * schedule. Safe to re-run — it removes any existing trigger for
 * `processKantongEmails` first, so it never creates duplicates.
 */
function createTimeTrigger() {
  for (const trigger of ScriptApp.getProjectTriggers()) {
    if (trigger.getHandlerFunction() === "processKantongEmails") {
      ScriptApp.deleteTrigger(trigger);
    }
  }

  ScriptApp.newTrigger("processKantongEmails").timeBased().everyMinutes(5).create();

  Logger.log("Trigger created — processKantongEmails will now run every 5 minutes.");

  // Also run once immediately so setup can be verified right away.
  processKantongEmails();
}