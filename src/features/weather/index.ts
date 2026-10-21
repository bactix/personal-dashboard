import type { WidgetDefinition } from "@/types/widget";

import { WeatherWidget } from "./components/weather-widget";

// Public surface of the weather feature. Server-only code lives in ./server
// and is deliberately NOT re-exported here.
export const weatherWidget: WidgetDefinition = {
  id: "weather",
  title: "Weather",
  component: WeatherWidget,
  size: { md: 1, xl: 2 },
};
