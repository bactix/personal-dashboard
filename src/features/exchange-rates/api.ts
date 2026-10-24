import { http } from "@/lib/http/client";

import { exchangeRatesSchema, type ExchangeRates } from "./types";

export function fetchExchangeRates(): Promise<ExchangeRates> {
  return http("/api/exchange-rates", exchangeRatesSchema);
}
