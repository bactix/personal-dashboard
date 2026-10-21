import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { deleteAsset, fetchAssets, postAsset, putAsset } from "./api";
import type { CreateAssetInput } from "./types";

export const assetsQueryKey = ["assets"] as const;

export function useAssets() {
  return useQuery({ queryKey: assetsQueryKey, queryFn: fetchAssets });
}

export function useCreateAsset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: postAsset,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: assetsQueryKey }),
  });
}

export function useUpdateAsset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: CreateAssetInput }) => putAsset(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: assetsQueryKey }),
  });
}

export function useDeleteAsset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteAsset,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: assetsQueryKey }),
  });
}
