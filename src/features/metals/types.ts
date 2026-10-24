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
  /** USD per bitcoin. Missing when only the Bitcoin quote could not be fetched. */
  bitcoin: z.object({ perCoin: z.number() }).optional(),
  /** ISO timestamp of the most recent quote. */
  updatedAt: z.string(),
});

export type MetalPrices = z.infer<typeof metalPricesSchema>;
