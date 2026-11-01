import { z } from "zod";

import { http } from "@/lib/http/client";

import type { MetalHistory, MetalPrices } from "./types";

// Server-only: talks to the vendor (gold-api.com, no key needed). Imported by app/api/metals/route.ts.

const UPSTREAM_URL = "https://api.gold-api.com/price";
const GRAMS_PER_TROY_OUNCE = 31.1034768;

// The gold lira is the Ottoman/Rashadi coin: 7.216 g of 22-karat gold. Change these two for another coin
// (e.g. the English lira: 7.988 g, 22K, or an 8 g 21K lira).
const GOLD_LIRA_GRAMS = 7.216;
const GOLD_LIRA_KARAT = 22;

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
    goldLira: {
      perCoin: gold.perGram * GOLD_LIRA_GRAMS * (GOLD_LIRA_KARAT / 24),
      grams: GOLD_LIRA_GRAMS,
      karat: GOLD_LIRA_KARAT,
    },
    bitcoin: bitcoin ? { perCoin: bitcoin.perOunce } : undefined, // "ounce" here is just the quoted unit price
    updatedAt: quotes.map((item) => item.updatedAt).sort().at(-1) ?? gold.updatedAt,
  };
}

// Daily history comes from Yahoo Finance's chart endpoint (no key). Gold and silver use the
// front-month futures, which track spot closely; Bitcoin is spot.
const HISTORY_URL = "https://query1.finance.yahoo.com/v8/finance/chart";
const HISTORY_SYMBOLS = { gold: "GC=F", silver: "SI=F", bitcoin: "BTC-USD" } as const;

/** Yahoo rejects requests without a browser-like user agent. */
const HISTORY_HEADERS = { "User-Agent": "Mozilla/5.0" };

const historyChartSchema = z.object({
  chart: z.object({
    result: z
      .array(
        z.object({
          timestamp: z.array(z.number()).optional(),
          indicators: z.object({
            quote: z.array(z.object({ close: z.array(z.number().nullable()) })),
          }),
        })
      )
      .nullable(),
  }),
});

/** Closing price per UTC day for one symbol, over the last month. */
async function dailyCloses(symbol: string): Promise<Map<string, number>> {
  const upstream = await http(`${HISTORY_URL}/${symbol}`, historyChartSchema, {
    params: { range: "1mo", interval: "1d" },
    headers: HISTORY_HEADERS,
    next: { revalidate: 3600 },
  });
  const result = upstream.chart.result?.[0];
  const closes = new Map<string, number>();
  const prices = result?.indicators.quote[0]?.close ?? [];
  result?.timestamp?.forEach((seconds, index) => {
    const close = prices[index];
    if (close != null) closes.set(new Date(seconds * 1000).toISOString().slice(0, 10), close);
  });
  return closes;
}

export async function getMetalHistory(): Promise<MetalHistory> {
  // As with the current prices, a missing Bitcoin series leaves gold and silver intact.
  const [gold, silver, bitcoin] = await Promise.all([
    dailyCloses(HISTORY_SYMBOLS.gold),
    dailyCloses(HISTORY_SYMBOLS.silver),
    dailyCloses(HISTORY_SYMBOLS.bitcoin).catch(() => undefined),
  ]);

  // Markets trade on different days (Bitcoin every day, futures on weekdays), so line the series
  // up on one date axis and carry the last known price across the gaps.
  const series = { gold, silver, bitcoin };
  const dates = [...new Set([gold, silver, bitcoin].flatMap((closes) => [...(closes?.keys() ?? [])]))].sort();
  const latest: Partial<Record<"gold" | "silver" | "bitcoin", number>> = {};
  return {
    points: dates.map((date) => {
      for (const key of ["gold", "silver", "bitcoin"] as const) {
        const close = series[key]?.get(date);
        if (close !== undefined) latest[key] = close;
      }
      return { date, ...latest };
    }),
  };
}
