import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";

import { http } from "@/lib/http/client";
import { httpDelete } from "@/lib/http/delete";

import {
  currencySchema,
  type CreateCurrencyInput,
  type CurrencySetting,
} from "./currency-types";

export const currenciesQueryKey = ["currencies"] as const;

function fetchCurrencies(): Promise<CurrencySetting[]> {
  return http("/api/currencies", z.array(currencySchema));
}

export function useCurrencies() {
  return useQuery({ queryKey: currenciesQueryKey, queryFn: fetchCurrencies });
}

export function useCreateCurrency() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateCurrencyInput) =>
      http("/api/currencies", currencySchema, { method: "POST", json: input }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: currenciesQueryKey }),
  });
}

export function useUpdateCurrency() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: CreateCurrencyInput }) =>
      http(`/api/currencies/${encodeURIComponent(id)}`, currencySchema, {
        method: "PUT",
        json: input,
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: currenciesQueryKey }),
  });
}

export function useDeleteCurrency() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => httpDelete(`/api/currencies/${encodeURIComponent(id)}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: currenciesQueryKey }),
  });
}
