import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../db/dailyTransactions", () => ({
  createDailyTransaction: vi.fn(async () => "daily-doc-1"),
  dailyTransactionExistsForMessage: vi.fn(async () => false),
}));

import { handleIncomingEmail } from "../emailHandler";
import {
  createDailyTransaction,
  dailyTransactionExistsForMessage,
} from "../db/dailyTransactions";

const BCA_BODY = `
Status : Berhasil
Tanggal Transaksi : 13 Jul 2026 17:15:33
Jenis Transaksi : Pembayaran QRIS
Pembayaran Ke : FMI PLAZA OLEOS
Total Bayar : IDR 5,200.00
Nomor Referensi : 9527120260713171530273QRS0849819881
`;

const DANAMON_TRANSFER_BODY = `
Status Berhasil
No. Referensi 2026070719581198780
Nama Penerima Restiyana Dwi Astuti
Nominal Transaksi Rp50.000,00
`;

beforeEach(() => {
  vi.clearAllMocks();
});

describe("handleIncomingEmail", () => {
  it("logs a real transaction and stores the Gmail messageId for dedupe", async () => {
    const outcome = await handleIncomingEmail({
      from: "BCA <bca@bca.co.id>",
      subject: "Internet Transaction Journal",
      body: BCA_BODY,
      messageId: "gmail-msg-1",
    });

    expect(outcome).toEqual({ logged: true, category: "Food", amount: 5200 });
    expect(createDailyTransaction).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "expense",
        amount: 5200,
        category: "Food",
        pending: false,
        sourceMessageId: "gmail-msg-1",
      })
    );
  });

  it("skips a duplicate message without writing anything", async () => {
    vi.mocked(dailyTransactionExistsForMessage).mockResolvedValueOnce(true);

    const outcome = await handleIncomingEmail({
      from: "BCA <bca@bca.co.id>",
      subject: "Internet Transaction Journal",
      body: BCA_BODY,
      messageId: "gmail-msg-1",
    });

    expect(outcome).toEqual({ logged: false, reason: "duplicate (already logged)" });
    expect(createDailyTransaction).not.toHaveBeenCalled();
  });

  it("skips a Danamon self-transfer without writing anything", async () => {
    const outcome = await handleIncomingEmail({
      from: "D-Bank PRO by Danamon <dbank.app@danamon.co.id>",
      subject: "Transfer ke Rekening Lain Berhasil (Tidak Perlu Dibalas)",
      body: DANAMON_TRANSFER_BODY,
      messageId: "gmail-msg-2",
    });

    expect(outcome.logged).toBe(false);
    expect(createDailyTransaction).not.toHaveBeenCalled();
  });

  it("does not write anything for an unrecognized sender", async () => {
    const outcome = await handleIncomingEmail({
      from: "someone@example.com",
      subject: "hi",
      body: "not a bank email",
      messageId: "gmail-msg-3",
    });

    expect(outcome).toEqual({
      logged: false,
      reason: "unrecognized sender or unparseable email",
    });
    expect(createDailyTransaction).not.toHaveBeenCalled();
  });
});
