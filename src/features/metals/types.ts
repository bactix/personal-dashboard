import { z } from "zod";

const metalPriceSchema = z.object({
  /** USD per troy ounce. */
  perOunce: z.number(),
  /** USD per gram. */
  perGram: z.number(),
});

/** App-owned shape of the precious-metal prices. UI depends on this, never on the vendor JSON. */
export const metalPricesSchema = z.object({
  gold: metalPriceSchema,
  silver: metalPriceSchema,
  /** One gold lira coin (Ottoman/Rashadi), valued at the gold price of its fine gold; no dealer premium. */
  goldLira: z.object({ perCoin: z.number(), grams: z.number(), karat: z.number() }),
  /** USD per bitcoin. Missing when only the Bitcoin quote could not be fetched. */
  bitcoin: z.object({ perCoin: z.number() }).optional(),
  /** ISO timestamp of the most recent quote. */
  updatedAt: z.string(),
});

export type MetalPrices = z.infer<typeof metalPricesSchema>;

/** One day of closing prices. A series is missing before its first quote (or entirely, for Bitcoin). */
const metalHistoryPointSchema = z.object({
  /** Calendar day, YYYY-MM-DD (UTC). */
  date: z.string(),
  /** USD per troy ounce (gold and silver use front-month futures). */
  gold: z.number().optional(),
  silver: z.number().optional(),
  /** USD per bitcoin. */
  bitcoin: z.number().optional(),
});

export const metalHistorySchema = z.object({
  points: z.array(metalHistoryPointSchema),
});

export type MetalHistory = z.infer<typeof metalHistorySchema>;
