import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { deletePurchaseItem, fetchPurchaseItems, postPurchaseItem, putPurchaseItem } from "./api";
import type { CreatePurchaseItemInput } from "./types";

export const purchasesQueryKey = ["purchases"] as const;

export function usePurchaseItems() {
  return useQuery({ queryKey: purchasesQueryKey, queryFn: fetchPurchaseItems });
}

export function useCreatePurchaseItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: postPurchaseItem,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: purchasesQueryKey }),
  });
}

export function useDeletePurchaseItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deletePurchaseItem,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: purchasesQueryKey }),
  });
}

export function useUpdatePurchaseItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: CreatePurchaseItemInput }) => putPurchaseItem(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: purchasesQueryKey }),
  });
}
