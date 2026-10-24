import type { Budget, Transaction } from "./types";

/**
 * Cents withdrawn this month that are registered to a budget. Only withdrawals that name the
 * budget count; everything else is ignored. `month` is "yyyy-mm".
 */
export function spentThisMonth(
  budget: Pick<Budget, "id">,
  transactions: Transaction[],
  month: string
): number {
  let spent = 0;
  for (const transaction of transactions) {
    if (transaction.type !== "withdrawal") continue;
    if (transaction.budgetId !== budget.id) continue;
    if (!transaction.date.startsWith(month)) continue;
    spent += transaction.amountCents;
  }
  return spent;
}

export type BudgetTone = "green" | "yellow" | "orange" | "red";

/** At this share of the limit (or more) a budget is "near exceeding". */
export const NEAR_LIMIT_RATIO = 0.9;

/**
 * How a budget looks given what was spent:
 * green below half the limit, yellow from half, orange when near the limit (90% up to and including
 * the limit itself), red once it is over.
 */
export function budgetTone(spentCents: number, limitCents: number): BudgetTone {
  const ratio = spentCents / limitCents;
  if (ratio > 1) return "red";
  if (ratio >= NEAR_LIMIT_RATIO) return "orange";
  if (ratio >= 0.5) return "yellow";
  return "green";
}
