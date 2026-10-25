import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { transactionsQueryKey, walletsQueryKey } from "@/features/wallets";

import {
  deleteSubscription,
  fetchSubscriptionPayments,
  fetchSubscriptions,
  paySubscription,
  postSubscription,
  putSubscription,
} from "./api";
import type { CreateSubscriptionInput, PaySubscriptionInput } from "./types";

export const subscriptionsQueryKey = ["subscriptions"] as const;
export const subscriptionPaymentsQueryKey = ["subscriptions", "payments"] as const;

export function useSubscriptionPayments() {
  return useQuery({ queryKey: subscriptionPaymentsQueryKey, queryFn: fetchSubscriptionPayments });
}

/** Paying books a wallet transaction too, so wallets and transactions refresh with the payments. */
export function usePaySubscription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: PaySubscriptionInput }) => paySubscription(id, input),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: subscriptionPaymentsQueryKey }),
        queryClient.invalidateQueries({ queryKey: transactionsQueryKey }),
        queryClient.invalidateQueries({ queryKey: walletsQueryKey }),
      ]),
  });
}

export function useSubscriptions() {
  return useQuery({ queryKey: subscriptionsQueryKey, queryFn: fetchSubscriptions });
}

export function useCreateSubscription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: postSubscription,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: subscriptionsQueryKey }),
  });
}

export function useUpdateSubscription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: CreateSubscriptionInput }) => putSubscription(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: subscriptionsQueryKey }),
  });
}

export function useDeleteSubscription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteSubscription,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: subscriptionsQueryKey }),
  });
}
