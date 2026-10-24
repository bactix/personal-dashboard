import { z } from "zod";

/** App-owned shape of the exchange rates. UI depends on this, never on the vendor JSON. */
export const exchangeRatesSchema = z.object({
  /** The day the rates were published (yyyy-mm-dd). */
  date: z.string(),
  /** How many units of each currency one US dollar buys, e.g. { EUR: 0.89 }. */
  perUsd: z.record(z.string(), z.number()),
});

export type ExchangeRates = z.infer<typeof exchangeRatesSchema>;

/** US dollars one unit of `code` is worth (1 EUR = 1.12 USD), or undefined when there is no rate. */
export function usdPer(rates: ExchangeRates | undefined, code: string): number | undefined {
  if (code === "USD") return 1;
  const perUsd = rates?.perUsd[code];
  return perUsd ? 1 / perUsd : undefined;
}
