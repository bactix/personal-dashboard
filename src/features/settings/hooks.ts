import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { deleteTimezone, fetchCityMatches, fetchTimezones, postTimezone, putTimezone } from "./api";
import type { CreateTimezoneInput } from "./types";

export const timezonesQueryKey = ["timezones"] as const;

export function useTimezones() {
  return useQuery({ queryKey: timezonesQueryKey, queryFn: fetchTimezones });
}

export function useCreateTimezone() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: postTimezone,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: timezonesQueryKey }),
  });
}

export function useUpdateTimezone() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: CreateTimezoneInput }) => putTimezone(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: timezonesQueryKey }),
  });
}

export function useDeleteTimezone() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteTimezone,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: timezonesQueryKey }),
  });
}

/** City lookup for a (debounced) search term; disabled until it has 2+ characters. */
export function useCitySearch(term: string) {
  return useQuery({
    queryKey: ["city-search", term] as const,
    queryFn: () => fetchCityMatches(term),
    enabled: term.length >= 2,
    staleTime: 24 * 60 * 60 * 1000,
  });
}
