import type { Transaction, Wallet } from "./types";

/** Signed effect of a transaction on its wallet, in cents. */
export function signedCents(transaction: Pick<Transaction, "type" | "amountCents">): number {
  return transaction.type === "deposit" ? transaction.amountCents : -transaction.amountCents;
}

/**
 * Current balance per wallet id (cents): the wallet's starting balance plus its deposits minus
 * its withdrawals. Pass `wallets` so starting balances count; a wallet that is absent from the
 * result has a balance of 0.
 */
export function computeBalances(
  transactions: Transaction[],
  wallets: Pick<Wallet, "id" | "startingCents">[] = []
): Map<string, number> {
  const balances = new Map<string, number>();
  for (const wallet of wallets) {
    if (wallet.startingCents) balances.set(wallet.id, wallet.startingCents);
  }
  for (const transaction of transactions) {
    balances.set(
      transaction.walletId,
      (balances.get(transaction.walletId) ?? 0) + signedCents(transaction)
    );
  }
  return balances;
}

/** What to call a transaction in lists: Added / Taken, or Transfer in / out for a transfer's sides. */
export function transactionKindLabel(transaction: Pick<Transaction, "type" | "transferId">): string {
  if (transaction.transferId) return transaction.type === "deposit" ? "Transfer in" : "Transfer out";
  return transaction.type === "deposit" ? "Added" : "Taken";
}
