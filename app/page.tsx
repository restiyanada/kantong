import { listDailyTransactions } from "@/lib/db/dailyTransactions";
import { listSavingsTransactions } from "@/lib/db/savingsTransactions";
import { listCertificates } from "@/lib/db/depositoCertificates";
import { getBudgetForCycle } from "@/lib/db/budgets";
import { getTodayISO } from "@/lib/telegram/dateUtils";
import { budgetCycleOf, PAYDAY_DAY } from "@/lib/month";
import { requireAccess } from "@/lib/accessGate";
import { DashboardShell } from "@/components/DashboardShell";

// Personal finance data — never statically cache this page.
export const dynamic = "force-dynamic";

export default async function Home() {
  await requireAccess();

  const todayISO = getTodayISO();
  const [daily, savings, deposito, budgets] = await Promise.all([
    listDailyTransactions(),
    listSavingsTransactions(),
    listCertificates(),
    getBudgetForCycle(budgetCycleOf(todayISO, PAYDAY_DAY)),
  ]);

  return (
    <DashboardShell
      daily={daily}
      savings={savings}
      deposito={deposito}
      budgets={budgets}
      todayISO={todayISO}
    />
  );
}
