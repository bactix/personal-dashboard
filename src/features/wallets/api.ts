import { z } from "zod";

import { http } from "@/lib/http/client";
import { httpDelete } from "@/lib/http/delete";

import {
  budgetSchema,
  goalSchema,
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

export function fetchWallets(): Promise<Wallet[]> {
  return http("/api/wallets", z.array(walletSchema));
}

export function postWallet(input: CreateWalletInput): Promise<Wallet> {
  return http("/api/wallets", walletSchema, { method: "POST", json: input });
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

export function putTransaction(id: string, input: CreateTransactionInput): Promise<Transaction> {
  return http(`/api/transactions/${encodeURIComponent(id)}`, transactionSchema, { method: "PUT", json: input });
}

/** Moves money between two wallets; the result is not used, the lists are refreshed instead. */
export function postTransfer(input: CreateTransferInput): Promise<unknown> {
  return http("/api/transfers", z.unknown(), { method: "POST", json: input });
}

/** `transferId` is shared by both sides of the transfer. */
export function deleteTransfer(transferId: string): Promise<void> {
  return httpDelete(`/api/transfers/${encodeURIComponent(transferId)}`);
}
