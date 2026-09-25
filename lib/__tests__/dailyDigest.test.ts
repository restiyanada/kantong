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
const ORDINARY_DAY = "2026-07-14";

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

    const result = await sendDailyDigest(ORDINARY_DAY);

    expect(result).toEqual({ sent: 0, overflow: 0, skipped: true, salaryReminder: false });
    expect(sendMessage).not.toHaveBeenCalled();
  });

  it("sends an intro plus one message per pending transaction", async () => {
    vi.mocked(listPendingDailyTransactions).mockResolvedValue([
      pendingTx("a", 50000, "BUDI SANTOSO"),
      pendingTx("b", 1200000, "AGUS WIRYONO"),
    ]);

    const result = await sendDailyDigest(ORDINARY_DAY);

    expect(result).toEqual({ sent: 2, overflow: 0, skipped: false, salaryReminder: false });
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

    const result = await sendDailyDigest(ORDINARY_DAY);

    expect(result).toEqual({ sent: 10, overflow: 3, skipped: false, salaryReminder: false });
    // intro + 10 item messages + 1 overflow notice
    expect(sendMessage).toHaveBeenCalledTimes(12);
    expect(sendMessage).toHaveBeenLastCalledWith(
      CHAT_ID,
      expect.stringContaining("3 more on web app")
    );
  });

  it.each(["2026-09-23", "2026-09-24", "2026-09-25"])(
    "sends a salary reminder on %s even when nothing is pending",
    async (day) => {
      vi.mocked(listPendingDailyTransactions).mockResolvedValue([]);

      const result = await sendDailyDigest(day);

      expect(result).toEqual({ sent: 0, overflow: 0, skipped: true, salaryReminder: true });
      expect(sendMessage).toHaveBeenCalledTimes(1);
      expect(sendMessage).toHaveBeenCalledWith(CHAT_ID, expect.stringContaining("salary"));
    }
  );

  it("sends the salary reminder before the pending list on a payday", async () => {
    vi.mocked(listPendingDailyTransactions).mockResolvedValue([pendingTx("a", 50000, "BUDI")]);

    await sendDailyDigest("2026-09-25");

    expect(sendMessage).toHaveBeenNthCalledWith(1, CHAT_ID, expect.stringContaining("salary"));
    expect(sendMessage).toHaveBeenNthCalledWith(
      2,
      CHAT_ID,
      expect.stringContaining("1 transaction need attention")
    );
  });

  it("does not remind on the 22nd or 26th", async () => {
    vi.mocked(listPendingDailyTransactions).mockResolvedValue([]);

    expect((await sendDailyDigest("2026-09-22")).salaryReminder).toBe(false);
    expect((await sendDailyDigest("2026-09-26")).salaryReminder).toBe(false);
    expect(sendMessage).not.toHaveBeenCalled();
  });

  it("throws if TELEGRAM_CHAT_ID isn't configured", async () => {
    delete process.env.TELEGRAM_CHAT_ID;
    await expect(sendDailyDigest(ORDINARY_DAY)).rejects.toThrow("TELEGRAM_CHAT_ID");
  });
});
