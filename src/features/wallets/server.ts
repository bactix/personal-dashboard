import { InUseError } from "@/lib/api/delete-route";
import { createJsonStore } from "@/lib/storage/json-store";

import { computeBalances } from "./balances";
import {
  accountSchema,
  budgetSchema,
  budgetTitle,
  goalRecordSchema,
  transactionSchema,
  walletSchema,
  type Account,
  type Budget,
  type CreateAccountInput,
  type CreateBudgetInput,
  type CreateGoalInput,
  type CreateTransactionInput,
  type CreateWalletInput,
  type Goal,
  type Transaction,
  type Wallet,
} from "./types";

// Server-only: persistence for wallets and their transactions.
// Used by app/api/wallets and app/api/transactions.

const wallets = createJsonStore("wallets", walletSchema);
const accounts = createJsonStore("accounts", accountSchema);
const transactions = createJsonStore("transactions", transactionSchema);
const goals = createJsonStore("goals", goalRecordSchema);
const budgets = createJsonStore("budgets", budgetSchema);

export class WalletNotFoundError extends Error {
  constructor() {
    super("Wallet not found");
    this.name = "WalletNotFoundError";
  }
}

export class AccountNotFoundError extends Error {
  constructor() {
    super("Account not found");
    this.name = "AccountNotFoundError";
  }
}

export class InsufficientFundsError extends Error {
  constructor() {
    super("Not enough money in this wallet");
    this.name = "InsufficientFundsError";
  }
}

export async function listWallets(): Promise<Wallet[]> {
  const all = await wallets.list();
  return all.sort((a, b) => a.name.localeCompare(b.name));
}

export function createWallet(input: CreateWalletInput): Promise<Wallet> {
  return wallets.create(input);
}

export async function listAccounts(): Promise<Account[]> {
  const all = await accounts.list();
  return all.sort((a, b) => a.name.localeCompare(b.name));
}

export function createAccount(input: CreateAccountInput): Promise<Account> {
  return accounts.create(input);
}

/** Newest first. */
export async function listTransactions(): Promise<Transaction[]> {
  const all = await transactions.list();
  return all.sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
}

export async function createTransaction(input: CreateTransactionInput): Promise<Transaction> {
  if (!(await wallets.get(input.walletId))) throw new WalletNotFoundError();
  if (input.accountId && !(await accounts.get(input.accountId))) throw new AccountNotFoundError();

  if (input.type === "withdrawal") {
    const balance = computeBalances(await transactions.list()).get(input.walletId) ?? 0;
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
  const wallet = await wallets.create({ name: input.name, currency: input.currency });
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
  const wallet = await updateWallet(record.walletId, { name: input.name, currency: input.currency });
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
  if (input.accountId && !(await accounts.get(input.accountId))) throw new AccountNotFoundError();
  return budgets.create(input);
}

export async function updateBudget(id: string, input: CreateBudgetInput): Promise<Budget | undefined> {
  if (input.accountId && !(await accounts.get(input.accountId))) throw new AccountNotFoundError();
  return budgets.update(id, input);
}

export function removeBudget(id: string): Promise<boolean> {
  return budgets.remove(id);
}

export async function removeAccount(id: string): Promise<boolean> {
  if ((await budgets.list()).some((budget) => budget.accountId === id)) {
    throw new InUseError("This account is used by a budget. Delete or change that budget first.");
  }
  if ((await transactions.list()).some((transaction) => transaction.accountId === id)) {
    throw new InUseError("This account has transactions. Delete or reassign those first.");
  }
  return accounts.remove(id);
}

export async function removeTransaction(id: string): Promise<boolean> {
  const all = await transactions.list();
  const target = all.find((transaction) => transaction.id === id);
  if (!target) return false;
  if (target.type === "deposit") {
    const balance = computeBalances(all).get(target.walletId) ?? 0;
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
  return wallets.update(id, input);
}

export function updateAccount(id: string, input: CreateAccountInput): Promise<Account | undefined> {
  return accounts.update(id, input);
}

export async function updateTransaction(
  id: string,
  input: CreateTransactionInput
): Promise<Transaction | undefined> {
  const all = await transactions.list();
  const current = all.find((transaction) => transaction.id === id);
  if (!current) return undefined;

  if (!(await wallets.get(input.walletId))) throw new WalletNotFoundError();
  if (input.accountId && !(await accounts.get(input.accountId))) throw new AccountNotFoundError();

  // The edit must not leave either the old or the new wallet with a negative balance.
  const balances = computeBalances(
    all.map((transaction) => (transaction.id === id ? { ...transaction, ...input } : transaction))
  );
  for (const walletId of new Set([current.walletId, input.walletId])) {
    if ((balances.get(walletId) ?? 0) < 0) {
      throw new InUseError("This change would leave a wallet with a negative balance.");
    }
  }
  return transactions.update(id, input);
}
