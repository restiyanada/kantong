import { listDailyTransactions } from "@/lib/db/dailyTransactions";
import { listSavingsTransactions } from "@/lib/db/savingsTransactions";
import { listCertificates } from "@/lib/db/depositoCertificates";
import { getTodayISO } from "@/lib/telegram/dateUtils";
import { requireAccess } from "@/lib/accessGate";
import { DashboardShell } from "@/components/DashboardShell";

// Personal finance data — never statically cache this page.
export const dynamic = "force-dynamic";

export default async function Home() {
  await requireAccess();

  const [daily, savings, deposito] = await Promise.all([
    listDailyTransactions(),
    listSavingsTransactions(),
    listCertificates(),
  ]);

  return (
    <DashboardShell
      daily={daily}
      savings={savings}
      deposito={deposito}
      todayISO={getTodayISO()}
    />
  );
}
