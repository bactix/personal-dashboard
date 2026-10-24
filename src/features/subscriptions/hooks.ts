import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { deleteSubscription, fetchSubscriptions, postSubscription, putSubscription } from "./api";
import type { CreateSubscriptionInput } from "./types";

export const subscriptionsQueryKey = ["subscriptions"] as const;

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
