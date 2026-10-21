import { http } from "@/lib/http/client";

import { weatherSnapshotSchema, type WeatherSnapshot } from "./types";

/** Client-side call to our own BFF route (which holds config and talks to the vendor). */
export function fetchWeather(): Promise<WeatherSnapshot> {
  return http("/api/weather", weatherSnapshotSchema);
}
