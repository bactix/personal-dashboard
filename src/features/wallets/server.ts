import { randomUUID } from "node:crypto";

import { InUseError } from "@/lib/api/delete-route";
import { createSupabaseStore } from "@/lib/storage/supabase-store";

import { computeBalances } from "./balances";
import {
  budgetSchema,
  budgetTitle,
  goalRecordSchema,
  transactionSchema,
  walletSchema,
  type Budget,
  type CreateBudgetInput,
  type CreateGoalInput,
  type CreateTransactionInput,
  type CreateTransferInput,
  type CreateWalletInput,
  type Goal,
  type Transaction,
  type Wallet,
} from "./types";

// Server-only: persistence for wallets and their transactions.
// Used by app/api/wallets and app/api/transactions.

// The wallet's starting balance is the `amount` column: a decimal in whole currency units,
// while the app works in cents.
const wallets = createSupabaseStore({
  table: "wallets",
  schema: walletSchema,
  exclude: ["startingCents"],
  readFix(candidate, raw) {
    candidate.startingCents = Math.round(Number(raw.amount ?? 0) * 100);
  },
  writeFix(row, input) {
    row.amount = input.startingCents / 100;
  },
});
// The app calls a transaction's day `date`; the column is `txn_date`.
const transactions = createSupabaseStore({
  table: "transactions",
  schema: transactionSchema,
  rename: { date: "txn_date" },
});
const goals = createSupabaseStore({ table: "goals", schema: goalRecordSchema });
const budgets = createSupabaseStore({ table: "budgets", schema: budgetSchema });

export class WalletNotFoundError extends Error {
  constructor() {
    super("Wallet not found");
    this.name = "WalletNotFoundError";
  }
}

export class InsufficientFundsError extends Error {
  constructor() {
    super("Not enough money in this wallet");
    this.name = "InsufficientFundsError";
  }
}

/** A transfer that can't happen (same wallet, different currencies); routes map it to a 400. */
export class TransferError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TransferError";
  }
}

export class BudgetNotFoundError extends Error {
  constructor() {
    super("Budget not found");
    this.name = "BudgetNotFoundError";
  }
}

/** The chosen budget can't take this transaction (wrong currency, or not a withdrawal). */
export class BudgetMismatchError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BudgetMismatchError";
  }
}

/** A transaction may be registered to a budget only if it is a withdrawal in the budget's currency. */
async function assertBudgetFits(input: CreateTransactionInput, walletCurrency: string) {
  if (!input.budgetId) return;
  if (input.type !== "withdrawal") {
    throw new BudgetMismatchError("Only money taken out can be registered to a budget.");
  }
  const budget = await budgets.get(input.budgetId);
  if (!budget) throw new BudgetNotFoundError();
  if (budget.currency !== walletCurrency) {
    throw new BudgetMismatchError(`That budget is in ${budget.currency}, but this wallet uses ${walletCurrency}.`);
  }
}

const TRANSFER_LOCKED = "This transaction is part of a transfer. Delete the transfer instead.";

export async function listWallets(): Promise<Wallet[]> {
  const all = await wallets.list();
  return all.sort((a, b) => a.name.localeCompare(b.name));
}

export function createWallet(input: CreateWalletInput): Promise<Wallet> {
  return wallets.create(input);
}

/** Newest first. */
export async function listTransactions(): Promise<Transaction[]> {
  const all = await transactions.list();
  return all.sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
}

export async function createTransaction(input: CreateTransactionInput): Promise<Transaction> {
  const wallet = await wallets.get(input.walletId);
  if (!wallet) throw new WalletNotFoundError();
  await assertBudgetFits(input, wallet.currency);

  if (input.type === "withdrawal") {
    const balance =
      computeBalances(await transactions.list(), await wallets.list()).get(input.walletId) ?? 0;
    if (input.amountCents > balance) throw new InsufficientFundsError();
  }
  return transactions.create(input);
}

export async function removeWallet(id: string): Promise<boolean> {
  if ((await goals.list()).some((goal) => goal.walletId === id)) {
    throw new InUseError("This wallet belongs to a goal. Delete the goal instead.");
  }
  if ((await transactions.list()).some((transaction) => transaction.walletId === id)) {
    throw new InUseError("This wallet has transactions. Delete those first.");
  }
  return wallets.remove(id);
}

/** Goals joined with their wallet's name and currency, newest first. */
export async function listGoals(): Promise<Goal[]> {
  const [records, allWallets] = await Promise.all([goals.list(), wallets.list()]);
  const walletById = new Map(allWallets.map((wallet) => [wallet.id, wallet]));
  const joined: Goal[] = [];
  for (const record of records) {
    const wallet = walletById.get(record.walletId);
    if (!wallet) continue;
    joined.push({
      id: record.id,
      walletId: wallet.id,
      name: wallet.name,
      currency: wallet.currency,
      targetCents: record.targetCents,
      targetDate: record.targetDate,
      createdAt: record.createdAt,
    });
  }
  return joined.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** Creating a goal creates the wallet that will hold its money. */
export async function createGoal(input: CreateGoalInput): Promise<Goal> {
  const wallet = await wallets.create({ name: input.name, currency: input.currency, startingCents: 0 });
  try {
    const record = await goals.create({
      walletId: wallet.id,
      targetCents: input.targetCents,
      targetDate: input.targetDate,
    });
    return {
      id: record.id,
      walletId: wallet.id,
      name: wallet.name,
      currency: wallet.currency,
      targetCents: record.targetCents,
      targetDate: record.targetDate,
      createdAt: record.createdAt,
    };
  } catch (error) {
    await wallets.remove(wallet.id); // don't leave an orphan wallet behind
    throw error;
  }
}

export async function updateGoal(id: string, input: CreateGoalInput): Promise<Goal | undefined> {
  const record = await goals.get(id);
  if (!record) return undefined;
  // Name and currency live on the wallet; this also blocks a currency change once it has transactions.
  const current = await wallets.get(record.walletId);
  const wallet = await updateWallet(record.walletId, {
    name: input.name,
    currency: input.currency,
    startingCents: current?.startingCents ?? 0, // a goal edit never touches the starting balance
  });
  if (!wallet) return undefined;
  const updated = await goals.update(id, {
    walletId: record.walletId,
    targetCents: input.targetCents,
    targetDate: input.targetDate,
  });
  if (!updated) return undefined;
  return {
    id: updated.id,
    walletId: wallet.id,
    name: wallet.name,
    currency: wallet.currency,
    targetCents: updated.targetCents,
    targetDate: updated.targetDate,
    createdAt: updated.createdAt,
  };
}

export async function removeGoal(id: string): Promise<boolean> {
  const record = await goals.get(id);
  if (!record) return false;
  if ((await transactions.list()).some((transaction) => transaction.walletId === record.walletId)) {
    throw new InUseError("This goal has money in it. Delete its transactions first.");
  }
  await goals.remove(id);
  await wallets.remove(record.walletId);
  return true;
}

export async function listBudgets(): Promise<Budget[]> {
  const all = await budgets.list();
  return all.sort((a, b) => budgetTitle(a).localeCompare(budgetTitle(b)));
}

export async function createBudget(input: CreateBudgetInput): Promise<Budget> {
  return budgets.create(input);
}

export async function updateBudget(id: string, input: CreateBudgetInput): Promise<Budget | undefined> {
  return budgets.update(id, input);
}

export function removeBudget(id: string): Promise<boolean> {
  return budgets.remove(id);
}

export async function removeTransaction(id: string): Promise<boolean> {
  const all = await transactions.list();
  const target = all.find((transaction) => transaction.id === id);
  if (!target) return false;
  if (target.transferId) throw new InUseError(TRANSFER_LOCKED);
  if (target.type === "deposit") {
    const balance = computeBalances(all, await wallets.list()).get(target.walletId) ?? 0;
    if (balance - target.amountCents < 0) {
      throw new InUseError("Deleting this deposit would leave the wallet with a negative balance.");
    }
  }
  return transactions.remove(id);
}

export async function updateWallet(id: string, input: CreateWalletInput): Promise<Wallet | undefined> {
  const current = await wallets.get(id);
  if (!current) return undefined;
  if (
    current.currency !== input.currency &&
    (await transactions.list()).some((transaction) => transaction.walletId === id)
  ) {
    throw new InUseError("This wallet has transactions, so its currency can't be changed.");
  }
  if (input.startingCents < current.startingCents) {
    // Lowering the starting balance must not push the wallet below zero.
    const all = await transactions.list();
    const mine = all.filter((transaction) => transaction.walletId === id);
    const balance = computeBalances(mine, [{ id, startingCents: input.startingCents }]).get(id) ?? 0;
    if (balance < 0) {
      throw new InUseError("That starting balance would leave this wallet with a negative balance.");
    }
  }
  return wallets.update(id, input);
}

export async function updateTransaction(
  id: string,
  input: CreateTransactionInput
): Promise<Transaction | undefined> {
  const all = await transactions.list();
  const current = all.find((transaction) => transaction.id === id);
  if (!current) return undefined;
  if (current.transferId) throw new InUseError(TRANSFER_LOCKED);

  const wallet = await wallets.get(input.walletId);
  if (!wallet) throw new WalletNotFoundError();
  await assertBudgetFits(input, wallet.currency);

  // The edit must not leave either the old or the new wallet with a negative balance.
  const balances = computeBalances(
    all.map((transaction) => (transaction.id === id ? { ...transaction, ...input } : transaction)),
    await wallets.list()
  );
  for (const walletId of new Set([current.walletId, input.walletId])) {
    if ((balances.get(walletId) ?? 0) < 0) {
      throw new InUseError("This change would leave a wallet with a negative balance.");
    }
  }
  return transactions.update(id, input);
}

/**
 * Moves money between two wallets: a withdrawal from `from` and a deposit into `to`, linked by
 * one transfer id. Both wallets must use the same currency and `from` must hold enough.
 */
export async function createTransfer(
  input: CreateTransferInput
): Promise<{ transferId: string; withdrawal: Transaction; deposit: Transaction }> {
  const [from, to] = await Promise.all([wallets.get(input.fromWalletId), wallets.get(input.toWalletId)]);
  if (!from || !to) throw new WalletNotFoundError();
  if (from.id === to.id) throw new TransferError("Choose two different wallets");
  if (from.currency !== to.currency) {
    throw new TransferError(`${from.name} uses ${from.currency} and ${to.name} uses ${to.currency}. Transfers need the same currency.`);
  }

  const balance = computeBalances(await transactions.list(), await wallets.list()).get(from.id) ?? 0;
  if (input.amountCents > balance) throw new InsufficientFundsError();

  const transferId = randomUUID();
  const withdrawal = await transactions.create({
    walletId: from.id,
    type: "withdrawal",
    amountCents: input.amountCents,
    note: input.note ? `Transfer to ${to.name}: ${input.note}` : `Transfer to ${to.name}`,
    date: input.date,
    transferId,
  });
  try {
    const deposit = await transactions.create({
      walletId: to.id,
      type: "deposit",
      amountCents: input.amountCents,
      note: input.note ? `Transfer from ${from.name}: ${input.note}` : `Transfer from ${from.name}`,
      date: input.date,
      transferId,
    });
    return { transferId, withdrawal, deposit };
  } catch (error) {
    await transactions.remove(withdrawal.id); // never leave half a transfer behind
    throw error;
  }
}

/** Deletes both sides of a transfer. False when no such transfer exists. */
export async function removeTransfer(transferId: string): Promise<boolean> {
  const all = await transactions.list();
  const legs = all.filter((transaction) => transaction.transferId === transferId);
  if (legs.length === 0) return false;

  // Taking the money back out of the receiving wallet must not leave it below zero.
  const deposit = legs.find((leg) => leg.type === "deposit");
  if (deposit) {
    const balance = computeBalances(all, await wallets.list()).get(deposit.walletId) ?? 0;
    if (balance - deposit.amountCents < 0) {
      throw new InUseError("The money from this transfer has already been spent, so it can't be deleted.");
    }
  }
  for (const leg of legs) await transactions.remove(leg.id);
  return true;
}
