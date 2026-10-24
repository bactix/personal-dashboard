import { useQuery } from "@tanstack/react-query";

import { fetchExchangeRates } from "./api";

const ONE_HOUR = 60 * 60 * 1000;

export const exchangeRatesQueryKey = ["exchange-rates"] as const;

export function useExchangeRates() {
  return useQuery({
    queryKey: exchangeRatesQueryKey,
    queryFn: fetchExchangeRates,
    staleTime: ONE_HOUR,
    refetchInterval: ONE_HOUR,
  });
}
