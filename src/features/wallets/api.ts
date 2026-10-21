import { z } from "zod";

import { http } from "@/lib/http/client";
import { httpDelete } from "@/lib/http/delete";

import {
  accountSchema,
  budgetSchema,
  goalSchema,
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

export function fetchWallets(): Promise<Wallet[]> {
  return http("/api/wallets", z.array(walletSchema));
}

export function postWallet(input: CreateWalletInput): Promise<Wallet> {
  return http("/api/wallets", walletSchema, { method: "POST", json: input });
}

export function fetchAccounts(): Promise<Account[]> {
  return http("/api/accounts", z.array(accountSchema));
}

export function postAccount(input: CreateAccountInput): Promise<Account> {
  return http("/api/accounts", accountSchema, { method: "POST", json: input });
}

export function fetchTransactions(): Promise<Transaction[]> {
  return http("/api/transactions", z.array(transactionSchema));
}

export function postTransaction(input: CreateTransactionInput): Promise<Transaction> {
  return http("/api/transactions", transactionSchema, { method: "POST", json: input });
}

export function deleteWallet(id: string): Promise<void> {
  return httpDelete(`/api/wallets/${encodeURIComponent(id)}`);
}

export function deleteAccount(id: string): Promise<void> {
  return httpDelete(`/api/accounts/${encodeURIComponent(id)}`);
}

export function deleteTransaction(id: string): Promise<void> {
  return httpDelete(`/api/transactions/${encodeURIComponent(id)}`);
}

export function fetchBudgets(): Promise<Budget[]> {
  return http("/api/budgets", z.array(budgetSchema));
}

export function postBudget(input: CreateBudgetInput): Promise<Budget> {
  return http("/api/budgets", budgetSchema, { method: "POST", json: input });
}

export function putBudget(id: string, input: CreateBudgetInput): Promise<Budget> {
  return http(`/api/budgets/${encodeURIComponent(id)}`, budgetSchema, { method: "PUT", json: input });
}

export function deleteBudget(id: string): Promise<void> {
  return httpDelete(`/api/budgets/${encodeURIComponent(id)}`);
}

export function fetchGoals(): Promise<Goal[]> {
  return http("/api/goals", z.array(goalSchema));
}

export function postGoal(input: CreateGoalInput): Promise<Goal> {
  return http("/api/goals", goalSchema, { method: "POST", json: input });
}

export function putGoal(id: string, input: CreateGoalInput): Promise<Goal> {
  return http(`/api/goals/${encodeURIComponent(id)}`, goalSchema, { method: "PUT", json: input });
}

export function deleteGoal(id: string): Promise<void> {
  return httpDelete(`/api/goals/${encodeURIComponent(id)}`);
}

export function putWallet(id: string, input: CreateWalletInput): Promise<Wallet> {
  return http(`/api/wallets/${encodeURIComponent(id)}`, walletSchema, { method: "PUT", json: input });
}

export function putAccount(id: string, input: CreateAccountInput): Promise<Account> {
  return http(`/api/accounts/${encodeURIComponent(id)}`, accountSchema, { method: "PUT", json: input });
}

export function putTransaction(id: string, input: CreateTransactionInput): Promise<Transaction> {
  return http(`/api/transactions/${encodeURIComponent(id)}`, transactionSchema, { method: "PUT", json: input });
}
