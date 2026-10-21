import { z } from "zod";

import { getServerEnv } from "@/lib/env";
import { http } from "@/lib/http/client";

import { describeWeatherCode } from "./conditions";
import type { WeatherSnapshot } from "./types";

// Server-only: reads env and talks to the vendor. Imported by app/api/weather/route.ts.

const UPSTREAM_URL = "https://api.open-meteo.com/v1/forecast";
const FORECAST_DAYS = 5;

/** Shape of the Open-Meteo response (vendor contract, private to this file). */
const upstreamSchema = z.object({
  current: z.object({
    temperature_2m: z.number(),
    apparent_temperature: z.number(),
    relative_humidity_2m: z.number(),
    wind_speed_10m: z.number(),
    weather_code: z.number(),
  }),
  daily: z.object({
    time: z.array(z.string()),
    weather_code: z.array(z.number()),
    temperature_2m_max: z.array(z.number()),
    temperature_2m_min: z.array(z.number()),
  }),
});

export async function getWeather(): Promise<WeatherSnapshot> {
  const env = getServerEnv();

  const upstream = await http(UPSTREAM_URL, upstreamSchema, {
    params: {
      latitude: env.WEATHER_LATITUDE,
      longitude: env.WEATHER_LONGITUDE,
      current:
        "temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code",
      daily: "weather_code,temperature_2m_max,temperature_2m_min",
      forecast_days: FORECAST_DAYS,
      timezone: "auto",
    },
    next: { revalidate: 600 },
  });

  const current = describeWeatherCode(upstream.current.weather_code);

  return {
    location: env.WEATHER_LOCATION_NAME,
    current: {
      temperatureC: upstream.current.temperature_2m,
      feelsLikeC: upstream.current.apparent_temperature,
      humidityPct: upstream.current.relative_humidity_2m,
      windKph: upstream.current.wind_speed_10m,
      condition: current.key,
      conditionLabel: current.label,
    },
    daily: upstream.daily.time.map((date, i) => {
      const day = describeWeatherCode(upstream.daily.weather_code[i]);
      return {
        date,
        maxC: upstream.daily.temperature_2m_max[i],
        minC: upstream.daily.temperature_2m_min[i],
        condition: day.key,
        conditionLabel: day.label,
      };
    }),
  };
}
