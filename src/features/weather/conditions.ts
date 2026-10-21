import type { ConditionKey } from "./types";

type Condition = { key: ConditionKey; label: string };

/** Maps WMO weather codes (used by Open-Meteo) to our own condition set. */
export function describeWeatherCode(code: number): Condition {
  if (code === 0) return { key: "clear", label: "Clear sky" };
  if (code <= 2) return { key: "partly-cloudy", label: "Partly cloudy" };
  if (code === 3) return { key: "cloudy", label: "Overcast" };
  if (code === 45 || code === 48) return { key: "fog", label: "Fog" };
  if (code >= 51 && code <= 57) return { key: "drizzle", label: "Drizzle" };
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) {
    return { key: "rain", label: "Rain" };
  }
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) {
    return { key: "snow", label: "Snow" };
  }
  if (code >= 95) return { key: "thunderstorm", label: "Thunderstorm" };
  return { key: "cloudy", label: "Cloudy" };
}
