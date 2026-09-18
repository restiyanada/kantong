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
    // Isolated: a problem loading budgets should never take down the rest
    // of the dashboard — it's the newest, least-exercised read here.
    getBudgetForCycle(budgetCycleOf(todayISO, PAYDAY_DAY)).catch((err) => {
      console.error("Failed to load budgets:", err);
      return {};
    }),
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
