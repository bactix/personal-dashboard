import { http } from "@/lib/http/client";

import { prayerTimesSchema, type PrayerTimes } from "./types";

/** Client-side call to our own BFF route (which talks to the vendor). */
export function fetchPrayerTimes(): Promise<PrayerTimes> {
  return http("/api/prayer-times", prayerTimesSchema);
}
