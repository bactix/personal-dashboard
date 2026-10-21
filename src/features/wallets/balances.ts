import type { Transaction } from "./types";

/** Signed effect of a transaction on its wallet, in cents. */
export function signedCents(transaction: Pick<Transaction, "type" | "amountCents">): number {
  return transaction.type === "deposit" ? transaction.amountCents : -transaction.amountCents;
}

/** Current balance per wallet id (cents). Wallets with no transactions are absent (= 0). */
export function computeBalances(transactions: Transaction[]): Map<string, number> {
  const balances = new Map<string, number>();
  for (const transaction of transactions) {
    balances.set(
      transaction.walletId,
      (balances.get(transaction.walletId) ?? 0) + signedCents(transaction)
    );
  }
  return balances;
}
