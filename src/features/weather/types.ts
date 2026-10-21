import { z } from "zod";

/** App-owned shape of weather data. UI depends on this, never on the vendor JSON. */
export const conditionKeySchema = z.enum([
  "clear",
  "partly-cloudy",
  "cloudy",
  "fog",
  "drizzle",
  "rain",
  "snow",
  "thunderstorm",
]);

export const weatherSnapshotSchema = z.object({
  location: z.string(),
  current: z.object({
    temperatureC: z.number(),
    feelsLikeC: z.number(),
    humidityPct: z.number(),
    windKph: z.number(),
    condition: conditionKeySchema,
    conditionLabel: z.string(),
  }),
  daily: z.array(
    z.object({
      date: z.string(), // ISO yyyy-mm-dd
      maxC: z.number(),
      minC: z.number(),
      condition: conditionKeySchema,
      conditionLabel: z.string(),
    })
  ),
});

export type ConditionKey = z.infer<typeof conditionKeySchema>;
export type WeatherSnapshot = z.infer<typeof weatherSnapshotSchema>;
