import type { Budget, Transaction, Wallet } from "./types";

/**
 * Cents withdrawn this month that count against a budget: same currency, and, when the
 * budget names an account, only withdrawals filed under it. `month` is "yyyy-mm".
 */
export function spentThisMonth(
  budget: Pick<Budget, "currency" | "accountId">,
  transactions: Transaction[],
  wallets: Wallet[],
  month: string
): number {
  const currencyByWallet = new Map(wallets.map((wallet) => [wallet.id, wallet.currency]));
  let spent = 0;
  for (const transaction of transactions) {
    if (transaction.type !== "withdrawal") continue;
    if (!transaction.date.startsWith(month)) continue;
    if (currencyByWallet.get(transaction.walletId) !== budget.currency) continue;
    if (budget.accountId && transaction.accountId !== budget.accountId) continue;
    spent += transaction.amountCents;
  }
  return spent;
}
