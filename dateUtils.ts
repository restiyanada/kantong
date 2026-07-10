/** Formats an integer IDR amount as "Rp1,000,000" (PRD section 6). */
export function formatIDR(amount: number): string {
  return `Rp${amount.toLocaleString("en-US")}`;
}
