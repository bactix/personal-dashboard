import { z } from "zod";

import { http } from "@/lib/http/client";

import type { MetalPrices } from "./types";

// Server-only: talks to the vendor (gold-api.com, no key needed). Imported by app/api/metals/route.ts.

const UPSTREAM_URL = "https://api.gold-api.com/price";
const GRAMS_PER_TROY_OUNCE = 31.1034768;

/** Shape of the gold-api.com response (vendor contract, private to this file). */
const upstreamSchema = z.object({
  price: z.number().positive(),
  updatedAt: z.string(),
});

async function quote(symbol: "XAU" | "XAG" | "BTC") {
  const upstream = await http(`${UPSTREAM_URL}/${symbol}`, upstreamSchema, {
    next: { revalidate: 300 },
  });
  return {
    perOunce: upstream.price,
    perGram: upstream.price / GRAMS_PER_TROY_OUNCE,
    updatedAt: upstream.updatedAt,
  };
}

export async function getMetalPrices(): Promise<MetalPrices> {
  // Bitcoin is a bonus: if only its quote fails, gold and silver still load.
  const [gold, silver, bitcoin] = await Promise.all([
    quote("XAU"),
    quote("XAG"),
    quote("BTC").catch(() => undefined),
  ]);
  const quotes = [gold, silver, ...(bitcoin ? [bitcoin] : [])];
  return {
    gold: { perOunce: gold.perOunce, perGram: gold.perGram },
    silver: { perOunce: silver.perOunce, perGram: silver.perGram },
    bitcoin: bitcoin ? { perCoin: bitcoin.perOunce } : undefined, // "ounce" here is just the quoted unit price
    updatedAt: quotes.map((item) => item.updatedAt).sort().at(-1) ?? gold.updatedAt,
  };
}
