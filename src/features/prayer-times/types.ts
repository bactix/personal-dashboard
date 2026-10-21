import { z } from "zod";

/** App-owned shape of the day's prayer times. UI depends on this, never on the vendor JSON. */
export const prayerKeySchema = z.enum(["fajr", "sunrise", "dhuhr", "asr", "maghrib", "isha"]);

export const prayerTimesSchema = z.object({
  location: z.string(),
  date: z.string(), // ISO yyyy-mm-dd (Lebanon time)
  hijriDate: z.string(),
  prayers: z.array(
    z.object({
      key: prayerKeySchema,
      label: z.string(),
      time: z.string(), // 24h "HH:mm", Lebanon local time
    })
  ),
});

export type PrayerKey = z.infer<typeof prayerKeySchema>;
export type PrayerTimes = z.infer<typeof prayerTimesSchema>;
