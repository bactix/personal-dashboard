import { useQuery } from "@tanstack/react-query";

import { fetchPrayerTimes } from "./api";

const ONE_HOUR = 60 * 60 * 1000;

export const prayerTimesQueryKey = ["prayer-times"] as const;

export function usePrayerTimes() {
  return useQuery({
    queryKey: prayerTimesQueryKey,
    queryFn: fetchPrayerTimes,
    staleTime: ONE_HOUR,
    refetchInterval: ONE_HOUR,
  });
}
