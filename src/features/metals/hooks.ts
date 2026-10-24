import { useQuery } from "@tanstack/react-query";

import { fetchMetalPrices } from "./api";

const FIVE_MINUTES = 5 * 60 * 1000;

export const metalPricesQueryKey = ["metal-prices"] as const;

export function useMetalPrices() {
  return useQuery({
    queryKey: metalPricesQueryKey,
    queryFn: fetchMetalPrices,
    staleTime: FIVE_MINUTES,
    refetchInterval: FIVE_MINUTES,
  });
}
