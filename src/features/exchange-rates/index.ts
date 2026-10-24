import type { WidgetDefinition } from "@/types/widget";

import { ExchangeRatesWidget } from "./components/exchange-rates-widget";

// Public surface of the exchange-rates feature. Server-only code lives in ./server
// and is deliberately NOT re-exported here.
export { RateCalculator } from "./components/rate-calculator";
export { useExchangeRates } from "./hooks";
export { usdPer } from "./types";

/** Full-width tile: EUR, CAD, AUD, AED and SAR against USD, each with a calculator (Financial dashboard). */
export const exchangeRatesWidget: WidgetDefinition = {
  id: "exchange-rates",
  title: "Exchange rates",
  component: ExchangeRatesWidget,
  size: { md: 2, xl: 4 },
};
