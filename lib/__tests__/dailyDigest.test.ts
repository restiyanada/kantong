import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../db/dailyTransactions", () => ({
  listPendingDailyTransactions: vi.fn(),
}));
vi.mock("../telegram/telegramApi", () => ({
  sendMessage: vi.fn(async () => undefined),
}));
vi.mock("../telegram/handleUpdate", () => ({
  buildCategoryKeyboard: vi.fn(() => ({ inline_keyboard: [] })),
}));

import { sendDailyDigest } from "../dailyDigest";
import { listPendingDailyTransactions } from "../db/dailyTransactions";
import { sendMessage } from "../telegram/telegramApi";

const CHAT_ID = 999888777;

function pendingTx(id: string, amount: number, note: string) {
  return {
    id,
    type: "expense" as const,
    amount,
    category: "Other",
    pending: true,
    note,
    date: "2026-07-14",
    createdAt: "2026-07-14T00:00:00.000Z",
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env.TELEGRAM_CHAT_ID = String(CHAT_ID);
});

describe("sendDailyDigest", () => {
  it("sends nothing on a silent day (no pending transactions)", async () => {
    vi.mocked(listPendingDailyTransactions).mockResolvedValue([]);

    const result = await sendDailyDigest();

    expect(result).toEqual({ sent: 0, overflow: 0, skipped: true });
    expect(sendMessage).not.toHaveBeenCalled();
  });

  it("sends an intro plus one message per pending transaction", async () => {
    vi.mocked(listPendingDailyTransactions).mockResolvedValue([
      pendingTx("a", 50000, "BUDI SANTOSO"),
      pendingTx("b", 1200000, "AGUS WIRYONO"),
    ]);

    const result = await sendDailyDigest();

    expect(result).toEqual({ sent: 2, overflow: 0, skipped: false });
    // intro + 2 item messages, no overflow message
    expect(sendMessage).toHaveBeenCalledTimes(3);
    expect(sendMessage).toHaveBeenNthCalledWith(
      1,
      CHAT_ID,
      expect.stringContaining("2 transactions need attention")
    );
    expect(sendMessage).toHaveBeenNthCalledWith(
      2,
      CHAT_ID,
      expect.stringContaining("BUDI SANTOSO"),
      expect.anything()
    );
  });

  it("caps at 10 items and reports the overflow count", async () => {
    const items = Array.from({ length: 13 }, (_, i) =>
      pendingTx(`tx-${i}`, 1000 * (i + 1), `Merchant ${i}`)
    );
    vi.mocked(listPendingDailyTransactions).mockResolvedValue(items);

    const result = await sendDailyDigest();

    expect(result).toEqual({ sent: 10, overflow: 3, skipped: false });
    // intro + 10 item messages + 1 overflow notice
    expect(sendMessage).toHaveBeenCalledTimes(12);
    expect(sendMessage).toHaveBeenLastCalledWith(
      CHAT_ID,
      expect.stringContaining("3 more on web app")
    );
  });

  it("throws if TELEGRAM_CHAT_ID isn't configured", async () => {
    delete process.env.TELEGRAM_CHAT_ID;
    await expect(sendDailyDigest()).rejects.toThrow("TELEGRAM_CHAT_ID");
  });
});
