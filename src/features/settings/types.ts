import { z } from "zod";

/** True when the runtime knows this IANA zone (e.g. "Europe/Paris"). */
function isValidTimeZone(value: string): boolean {
  try {
    new Intl.DateTimeFormat("en", { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

const timeZoneSchema = z
  .string()
  .trim()
  .min(1, "Time zone is required")
  .refine(isValidTimeZone, "Pick a valid time zone, e.g. Europe/Paris");

export const timezoneSchema = z.object({
  id: z.string(),
  city: z.string().min(1).max(60),
  /** IANA zone name. */
  timeZone: z.string().min(1),
  createdAt: z.string(),
});

export const createTimezoneInputSchema = z.object({
  city: z.string().trim().min(1, "City is required").max(60, "City is too long"),
  timeZone: timeZoneSchema,
});

export type Timezone = z.infer<typeof timezoneSchema>;
export type CreateTimezoneInput = z.infer<typeof createTimezoneInputSchema>;

/** One geocoding match for a typed city name. */
export const cityMatchSchema = z.object({
  /** Stable per match, so lists can key on it. */
  id: z.number(),
  name: z.string(),
  /** Region and country, e.g. "Île-de-France, France"; may be empty. */
  area: z.string(),
  timeZone: z.string(),
});

export type CityMatch = z.infer<typeof cityMatchSchema>;
