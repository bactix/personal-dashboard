import { z } from "zod";

import { http } from "@/lib/http/client";
import { createJsonStore } from "@/lib/storage/json-store";

import { timezoneSchema, type CityMatch, type CreateTimezoneInput, type Timezone } from "./types";

// Server-only: persistence for dashboard settings (currently the city time zones).

const store = createJsonStore("timezones", timezoneSchema);

export async function listTimezones(): Promise<Timezone[]> {
  const items = await store.list();
  return items.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export function createTimezone(input: CreateTimezoneInput): Promise<Timezone> {
  return store.create(input);
}

export function updateTimezone(id: string, input: CreateTimezoneInput): Promise<Timezone | undefined> {
  return store.update(id, input);
}

export function removeTimezone(id: string): Promise<boolean> {
  return store.remove(id);
}

const GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search";

/** Shape of the Open-Meteo geocoding response (vendor contract, private to this file). */
const geocodingSchema = z.object({
  results: z
    .array(
      z.object({
        id: z.number(),
        name: z.string(),
        admin1: z.string().optional(),
        country: z.string().optional(),
        timezone: z.string().optional(),
      })
    )
    .optional(),
});

/** Finds cities by name and returns each one's IANA time zone. */
export async function searchCities(query: string): Promise<CityMatch[]> {
  const upstream = await http(GEOCODING_URL, geocodingSchema, {
    params: { name: query, count: 6, language: "en", format: "json" },
    next: { revalidate: 86_400 },
  });

  return (upstream.results ?? []).flatMap((result) =>
    result.timezone
      ? [
          {
            id: result.id,
            name: result.name,
            area: [result.admin1, result.country].filter(Boolean).join(", "),
            timeZone: result.timezone,
          },
        ]
      : []
  );
}
