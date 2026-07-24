import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../db/dailyTransactions", () => ({
  createDailyTransaction: vi.fn(async () => "daily-doc-1"),
  resolveDailyCategory: vi.fn(async () => undefined),
  updateDailyTransactionNote: vi.fn(async () => undefined),
}));
vi.mock("../../db/savingsTransactions", () => ({
  createSavingsTransaction: vi.fn(async () => "savings-doc-1"),
}));
vi.mock("../../db/depositoCertificates", () => ({
  createCertificate: vi.fn(async () => "cert-doc-1"),
  findActiveCertificatesByBank: vi.fn(async () => []),
  closeCertificate: vi.fn(async () => undefined),
  renewCertificate: vi.fn(async () => undefined),
}));
vi.mock("../telegramApi", () => ({
  sendMessage: vi.fn(async () => undefined),
  answerCallbackQuery: vi.fn(async () => undefined),
  editMessageReplyMarkup: vi.fn(async () => undefined),
  editMessageText: vi.fn(async () => undefined),
}));

import { handleUpdate } from "../handleUpdate";
import { createDailyTransaction, resolveDailyCategory, updateDailyTransactionNote } from "../../db/dailyTransactions";
import { createSavingsTransaction } from "../../db/savingsTransactions";
import {
  createCertificate,
  findActiveCertificatesByBank,
  closeCertificate,
  renewCertificate,
} from "../../db/depositoCertificates";
import { sendMessage, answerCallbackQuery, editMessageText } from "../telegramApi";
import { getTodayISO } from "../dateUtils";

const CHAT_ID = 12345;

function message(text: string) {
  return { update_id: 1, message: { message_id: 1, chat: { id: CHAT_ID }, text } };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("handleUpdate — Daily", () => {
  it("logs a recognized-category expense and sends a direct confirmation", async () => {
    await handleUpdate(message("25000 food nasi goreng"));

    expect(createDailyTransaction).toHaveBeenCalledWith(
      expect.objectContaining({ category: "Food", pending: false, amount: 25000 })
    );
    expect(sendMessage).toHaveBeenCalledTimes(1);
    expect(sendMessage).toHaveBeenCalledWith(CHAT_ID, expect.stringContaining("Food"));
  });

  it("prompts for a note (force-reply) when a recognized-category entry has none", async () => {
    await handleUpdate(message("25000 food"));

    expect(createDailyTransaction).toHaveBeenCalledWith(
      expect.objectContaining({ category: "Food", pending: false, note: "" })
    );
    expect(sendMessage).toHaveBeenCalledWith(
      CHAT_ID,
      expect.stringContaining("ref:daily-doc-1"),
      { force_reply: true }
    );
  });

  it("logs a no-note income entry and prompts for a note the same way", async () => {
    await handleUpdate(message("+5000000 salary"));

    expect(createDailyTransaction).toHaveBeenCalledWith(
      expect.objectContaining({ type: "income", category: "Salary", note: "" })
    );
    expect(sendMessage).toHaveBeenCalledWith(
      CHAT_ID,
      expect.stringContaining("ref:daily-doc-1"),
      { force_reply: true }
    );
  });

  it("creates a pending entry and sends category buttons for an unmatched category", async () => {
    await handleUpdate(message("25000 xyz something"));

    expect(createDailyTransaction).toHaveBeenCalledWith(
      expect.objectContaining({ pending: true, category: "" })
    );
    // Only one message sent (the category prompt) — no separate "attention" text.
    expect(sendMessage).toHaveBeenCalledTimes(1);
    expect(sendMessage).toHaveBeenCalledWith(
      CHAT_ID,
      expect.stringContaining("Which category?"),
      expect.objectContaining({ inline_keyboard: expect.any(Array) })
    );
  });
});

describe("handleUpdate — note prompt reply", () => {
  it("saves the note when replying to the 'add a note?' prompt", async () => {
    await handleUpdate({
      update_id: 10,
      message: {
        message_id: 50,
        chat: { id: CHAT_ID },
        text: "nasi goreng deket kantor",
        reply_to_message: {
          message_id: 49,
          chat: { id: CHAT_ID },
          text: "✅ -Rp25,000 — Food\n✏️ Add a note? Reply to this message. (ref:daily-doc-1)",
        },
      },
    });

    expect(updateDailyTransactionNote).toHaveBeenCalledWith(
      "daily-doc-1",
      "nasi goreng deket kantor"
    );
    expect(createDailyTransaction).not.toHaveBeenCalled();
    expect(sendMessage).toHaveBeenCalledWith(CHAT_ID, expect.stringContaining("Note saved"));
  });

  it("falls through to normal parsing when the reply isn't a note prompt", async () => {
    await handleUpdate({
      update_id: 11,
      message: {
        message_id: 51,
        chat: { id: CHAT_ID },
        text: "25000 food nasi goreng",
        reply_to_message: {
          message_id: 50,
          chat: { id: CHAT_ID },
          text: "just some other message",
        },
      },
    });

    expect(updateDailyTransactionNote).not.toHaveBeenCalled();
    expect(createDailyTransaction).toHaveBeenCalledWith(
      expect.objectContaining({ category: "Food" })
    );
  });
});

describe("handleUpdate — Savings", () => {
  it("logs a savings transfer with the default goal", async () => {
    await handleUpdate(message("nabung +1000000 monthly transfer"));

    expect(createSavingsTransaction).toHaveBeenCalledWith(
      expect.objectContaining({ direction: "in", amount: 1000000, goal: "General" })
    );
    expect(sendMessage).toHaveBeenCalledWith(CHAT_ID, expect.stringContaining("General"));
  });
});

describe("handleUpdate — Deposito", () => {
  it("opens a new certificate", async () => {
    await handleUpdate(message("deposito 20jt bca 6bulan"));

    expect(createCertificate).toHaveBeenCalledWith(
      expect.objectContaining({ bank: "BCA", principal: 20_000_000, termMonths: 6 })
    );
  });

  it("reports when no active certificate matches for cairkan", async () => {
    vi.mocked(findActiveCertificatesByBank).mockResolvedValueOnce([]);

    await handleUpdate(message("deposito cairkan bca"));

    expect(closeCertificate).not.toHaveBeenCalled();
    expect(sendMessage).toHaveBeenCalledWith(
      CHAT_ID,
      expect.stringContaining("No active deposito found at BCA")
    );
  });

  it("closes directly when exactly one certificate matches", async () => {
    vi.mocked(findActiveCertificatesByBank).mockResolvedValueOnce([
      { id: "c1", bank: "BCA", principal: 20_000_000, openedDate: "2026-01-01", maturityDate: "2026-07-01", termMonths: 6, status: "active", createdAt: "2026-01-01T00:00:00.000Z" },
    ]);

    await handleUpdate(message("deposito cairkan bca"));

    expect(closeCertificate).toHaveBeenCalledWith("c1", getTodayISO());
  });

  it("asks for disambiguation when multiple certificates match", async () => {
    vi.mocked(findActiveCertificatesByBank).mockResolvedValueOnce([
      { id: "c1", bank: "BCA", principal: 20_000_000, openedDate: "2026-01-01", maturityDate: "2026-07-01", termMonths: 6, status: "active", createdAt: "2026-01-01T00:00:00.000Z" },
      { id: "c2", bank: "BCA", principal: 10_000_000, openedDate: "2026-02-01", maturityDate: "2026-08-01", termMonths: 6, status: "active", createdAt: "2026-02-01T00:00:00.000Z" },
    ]);

    await handleUpdate(message("deposito perpanjang bca 6bulan"));

    expect(renewCertificate).not.toHaveBeenCalled();
    expect(sendMessage).toHaveBeenCalledWith(
      CHAT_ID,
      expect.stringContaining("Multiple deposito"),
      expect.objectContaining({
        inline_keyboard: [
          [expect.objectContaining({ callback_data: "dep_p:c1:6" })],
          [expect.objectContaining({ callback_data: "dep_p:c2:6" })],
        ],
      })
    );
  });
});

describe("handleUpdate — bulk paste", () => {
  it("summarizes logged vs needs-attention counts across lines", async () => {
    const bulk = [
      "25/06 50000 food nasi padang",
      "25/06 20000 transport ojek",
      "30000 xyz unclear",
    ].join("\n");

    await handleUpdate(message(bulk));

    expect(sendMessage).toHaveBeenCalledWith(
      CHAT_ID,
      expect.stringContaining("2 logged, 1 need attention")
    );
  });
});

describe("handleUpdate — callback queries", () => {
  it("resolves a pending category selection", async () => {
    await handleUpdate({
      update_id: 2,
      callback_query: {
        id: "cbq1",
        data: "dc:daily-doc-1:Food",
        message: { message_id: 42, chat: { id: CHAT_ID } },
      },
    });

    expect(resolveDailyCategory).toHaveBeenCalledWith("daily-doc-1", "Food");
    expect(answerCallbackQuery).toHaveBeenCalledWith("cbq1", "Saved: Food");
    expect(editMessageText).toHaveBeenCalledWith(
      CHAT_ID,
      42,
      expect.stringContaining("Food")
    );
  });

  it("renews a certificate from a disambiguation tap", async () => {
    await handleUpdate({
      update_id: 3,
      callback_query: {
        id: "cbq2",
        data: "dep_p:c1:6",
        message: { message_id: 43, chat: { id: CHAT_ID } },
      },
    });

    expect(renewCertificate).toHaveBeenCalledWith("c1", 6, expect.any(String));
  });
});
