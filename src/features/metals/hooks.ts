import { useQuery } from "@tanstack/react-query";

import { fetchMetalHistory, fetchMetalPrices } from "./api";

const FIVE_MINUTES = 5 * 60 * 1000;
const ONE_HOUR = 60 * 60 * 1000;

export const metalPricesQueryKey = ["metal-prices"] as const;
export const metalHistoryQueryKey = ["metal-history"] as const;

export function useMetalPrices() {
  return useQuery({
    queryKey: metalPricesQueryKey,
    queryFn: fetchMetalPrices,
    staleTime: FIVE_MINUTES,
    refetchInterval: FIVE_MINUTES,
  });
}

/** Daily closes change slowly, so this refreshes hourly rather than every few minutes. */
export function useMetalHistory() {
  return useQuery({
    queryKey: metalHistoryQueryKey,
    queryFn: fetchMetalHistory,
    staleTime: ONE_HOUR,
  });
}
