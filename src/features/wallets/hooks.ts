import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { deleteAccount, deleteBudget, deleteGoal, deleteTransaction, deleteWallet, fetchAccounts, fetchBudgets, fetchGoals, fetchTransactions, fetchWallets, postAccount, postBudget, postGoal, postTransaction, postWallet, putAccount, putBudget, putGoal, putTransaction, putWallet } from "./api";
import type { CreateAccountInput, CreateBudgetInput, CreateGoalInput, CreateTransactionInput, CreateWalletInput } from "./types";

export const walletsQueryKey = ["wallets"] as const;
export const budgetsQueryKey = ["budgets"] as const;
export const goalsQueryKey = ["goals"] as const;
export const accountsQueryKey = ["accounts"] as const;
export const transactionsQueryKey = ["transactions"] as const;

export function useWallets() {
  return useQuery({ queryKey: walletsQueryKey, queryFn: fetchWallets });
}

export function useAccounts() {
  return useQuery({ queryKey: accountsQueryKey, queryFn: fetchAccounts });
}

export function useTransactions() {
  return useQuery({ queryKey: transactionsQueryKey, queryFn: fetchTransactions });
}

export function useCreateWallet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: postWallet,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: walletsQueryKey }),
  });
}

export function useCreateAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: postAccount,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: accountsQueryKey }),
  });
}

export function useCreateTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: postTransaction,
    // Balances are derived from transactions, so only this list needs refreshing.
    onSuccess: () => queryClient.invalidateQueries({ queryKey: transactionsQueryKey }),
  });
}

export function useDeleteWallet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteWallet,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: walletsQueryKey }),
  });
}

export function useDeleteAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteAccount,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: accountsQueryKey }),
  });
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteTransaction,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: transactionsQueryKey }),
  });
}

export function useBudgets() {
  return useQuery({ queryKey: budgetsQueryKey, queryFn: fetchBudgets });
}

export function useCreateBudget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: postBudget,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: budgetsQueryKey }),
  });
}

export function useUpdateBudget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: CreateBudgetInput }) => putBudget(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: budgetsQueryKey }),
  });
}

export function useDeleteBudget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteBudget,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: budgetsQueryKey }),
  });
}

export function useGoals() {
  return useQuery({ queryKey: goalsQueryKey, queryFn: fetchGoals });
}

/** A goal owns a wallet, so every goal change also refreshes the wallets list. */
function useInvalidateGoalsAndWallets() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: goalsQueryKey }),
      queryClient.invalidateQueries({ queryKey: walletsQueryKey }),
    ]);
}

export function useCreateGoal() {
  const invalidate = useInvalidateGoalsAndWallets();
  return useMutation({ mutationFn: postGoal, onSuccess: invalidate });
}

export function useUpdateGoal() {
  const invalidate = useInvalidateGoalsAndWallets();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: CreateGoalInput }) => putGoal(id, input),
    onSuccess: invalidate,
  });
}

export function useDeleteGoal() {
  const invalidate = useInvalidateGoalsAndWallets();
  return useMutation({ mutationFn: deleteGoal, onSuccess: invalidate });
}

export function useUpdateWallet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: CreateWalletInput }) => putWallet(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: walletsQueryKey }),
  });
}

export function useUpdateAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: CreateAccountInput }) => putAccount(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: accountsQueryKey }),
  });
}

export function useUpdateTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: CreateTransactionInput }) => putTransaction(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: transactionsQueryKey }),
  });
}
