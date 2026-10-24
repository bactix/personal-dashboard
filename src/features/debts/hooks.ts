import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { transactionsQueryKey, walletsQueryKey } from "@/features/wallets";

import { deleteDebt, fetchDebts, payDebt, postDebt, putDebt } from "./api";
import type { CreateDebtInput, PayDebtInput } from "./types";

export const debtsQueryKey = ["debts"] as const;

export function useDebts() {
  return useQuery({ queryKey: debtsQueryKey, queryFn: fetchDebts });
}

export function useCreateDebt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: postDebt,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: debtsQueryKey }),
  });
}

export function useDeleteDebt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteDebt,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: debtsQueryKey }),
  });
}

export function useUpdateDebt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: CreateDebtInput }) => putDebt(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: debtsQueryKey }),
  });
}

/** Paying books a wallet transaction too, so wallets and transactions refresh with the debts. */
export function usePayDebt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: PayDebtInput }) => payDebt(id, input),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: debtsQueryKey }),
        queryClient.invalidateQueries({ queryKey: transactionsQueryKey }),
        queryClient.invalidateQueries({ queryKey: walletsQueryKey }),
      ]),
  });
}
