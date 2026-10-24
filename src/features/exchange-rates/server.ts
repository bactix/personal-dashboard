import { z } from "zod";

import { http } from "@/lib/http/client";

import type { ExchangeRates } from "./types";

// Server-only: talks to the vendor (ExchangeRate-API's free open endpoint, no key needed; it
// covers AED, SAR and LBP, which the European Central Bank does not publish). The free tier asks
// for attribution, which the widget shows. Imported by app/api/exchange-rates/route.ts.

const UPSTREAM_URL = "https://open.er-api.com/v6/latest/USD";

/** Shape of the vendor response (vendor contract, private to this file). */
const upstreamSchema = z.object({
  result: z.literal("success"),
  time_last_update_unix: z.number(),
  rates: z.record(z.string(), z.number().positive()),
});

export async function getExchangeRates(): Promise<ExchangeRates> {
  const upstream = await http(UPSTREAM_URL, upstreamSchema, {
    // The provider refreshes once a day, so an hour of caching loses nothing.
    next: { revalidate: 3600 },
  });
  return {
    date: new Date(upstream.time_last_update_unix * 1000).toISOString().slice(0, 10),
    perUsd: upstream.rates,
  };
}
