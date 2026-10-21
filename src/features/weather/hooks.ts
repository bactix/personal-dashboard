import { useQuery } from "@tanstack/react-query";

import { fetchWeather } from "./api";

const TEN_MINUTES = 10 * 60 * 1000;

export const weatherQueryKey = ["weather"] as const;

export function useWeather() {
  return useQuery({
    queryKey: weatherQueryKey,
    queryFn: fetchWeather,
    staleTime: TEN_MINUTES,
    refetchInterval: TEN_MINUTES,
  });
}
