import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { deleteStashItem, fetchStash, postStashItem, putStashItem } from "./api";
import type { CreateStashInput } from "./types";

export const stashQueryKey = ["stash"] as const;

export function useStash() {
  return useQuery({ queryKey: stashQueryKey, queryFn: fetchStash });
}

export function useCreateStashItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: postStashItem,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: stashQueryKey }),
  });
}

export function useUpdateStashItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: CreateStashInput }) => putStashItem(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: stashQueryKey }),
  });
}

export function useDeleteStashItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteStashItem,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: stashQueryKey }),
  });
}
