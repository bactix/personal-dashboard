import { formatMoney } from "@/lib/money";

import type { Debt, DebtDirection } from "./types";

/** Sums per currency so different currencies are never added together. */
export function totalsFor(debts: Debt[], direction: DebtDirection): string {
  const byCurrency = new Map<string, number>();
  for (const debt of debts) {
    if (debt.direction !== direction) continue;
    byCurrency.set(debt.currency, (byCurrency.get(debt.currency) ?? 0) + debt.amountCents);
  }
  if (byCurrency.size === 0) return "—";
  return [...byCurrency].map(([currency, cents]) => formatMoney(cents, currency)).join(" · ");
}
