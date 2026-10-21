import { z } from "zod";

import { http } from "@/lib/http/client";

import type { PrayerKey, PrayerTimes } from "./types";

// Server-only: talks to the Aladhan API (keyless). Imported by app/api/prayer-times/route.ts.

const UPSTREAM_URL = "https://api.aladhan.com/v1/timingsByCity";
const TIME_ZONE = "Asia/Beirut";
const CITY = "Beirut";
const COUNTRY = "Lebanon";
/** Aladhan calculation method 3 = Muslim World League. */
const METHOD = 3;

const PRAYERS: { key: PrayerKey; label: string; field: string }[] = [
  { key: "fajr", label: "Fajr", field: "Fajr" },
  { key: "sunrise", label: "Sunrise", field: "Sunrise" },
  { key: "dhuhr", label: "Dhuhr", field: "Dhuhr" },
  { key: "asr", label: "Asr", field: "Asr" },
  { key: "maghrib", label: "Maghrib", field: "Maghrib" },
  { key: "isha", label: "Isha", field: "Isha" },
];

/** Shape of the Aladhan response (vendor contract, private to this file). */
const upstreamSchema = z.object({
  data: z.object({
    timings: z.record(z.string(), z.string()),
    date: z.object({
      hijri: z.object({
        day: z.string(),
        month: z.object({ en: z.string() }),
        year: z.string(),
      }),
    }),
  }),
});

/** Today's date in Lebanon, independent of the server's own timezone. */
function lebanonToday(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: TIME_ZONE });
}

export async function getPrayerTimes(): Promise<PrayerTimes> {
  const today = lebanonToday();
  const [year, month, day] = today.split("-");

  const { data } = await http(`${UPSTREAM_URL}/${day}-${month}-${year}`, upstreamSchema, {
    params: { city: CITY, country: COUNTRY, method: METHOD },
    next: { revalidate: 3600 },
  });

  const { hijri } = data.date;

  return {
    location: `${CITY}, ${COUNTRY}`,
    date: today,
    hijriDate: `${hijri.day} ${hijri.month.en} ${hijri.year}`,
    prayers: PRAYERS.map(({ key, label, field }) => {
      const raw = data.timings[field];
      // Some responses append the zone, e.g. "05:12 (EET)"; keep only HH:mm.
      const time = raw?.match(/\d{1,2}:\d{2}/)?.[0];
      if (!time) throw new Error(`Missing prayer time: ${field}`);
      return { key, label, time };
    }),
  };
}
