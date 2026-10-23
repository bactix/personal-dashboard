import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";

import { http } from "@/lib/http/client";
import { httpDelete } from "@/lib/http/delete";

import { logoSchema, type CreateLogoInput, type Logo } from "./logo-types";

export const logosQueryKey = ["logos"] as const;

function fetchLogos(): Promise<Logo[]> {
  return http("/api/logos", z.array(logoSchema));
}

export function useLogos() {
  return useQuery({ queryKey: logosQueryKey, queryFn: fetchLogos });
}

export function useCreateLogo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateLogoInput) =>
      http("/api/logos", logoSchema, { method: "POST", json: input, timeoutMs: 30_000 }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: logosQueryKey }),
  });
}

export function useUpdateLogo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: CreateLogoInput }) =>
      http(`/api/logos/${encodeURIComponent(id)}`, logoSchema, {
        method: "PUT",
        json: input,
        timeoutMs: 30_000,
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: logosQueryKey }),
  });
}

export function useDeleteLogo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => httpDelete(`/api/logos/${encodeURIComponent(id)}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: logosQueryKey }),
  });
}
