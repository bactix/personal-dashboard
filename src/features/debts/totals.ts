import { formatMoney } from "@/lib/money";

import type { Debt, DebtDirection } from "./types";

/** What is still unpaid on a debt, in cents. */
export const remainingCents = (debt: Pick<Debt, "amountCents" | "paidCents">): number =>
  debt.amountCents - debt.paidCents;

/** Sums what is still unpaid per currency so different currencies are never added together. */
export function totalsFor(debts: Debt[], direction: DebtDirection): string {
  const byCurrency = new Map<string, number>();
  for (const debt of debts) {
    if (debt.direction !== direction || remainingCents(debt) <= 0) continue;
    byCurrency.set(debt.currency, (byCurrency.get(debt.currency) ?? 0) + remainingCents(debt));
  }
  if (byCurrency.size === 0) return "—";
  return [...byCurrency].map(([currency, cents]) => formatMoney(cents, currency)).join(" · ");
}
