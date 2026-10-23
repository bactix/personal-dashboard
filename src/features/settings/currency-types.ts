import { z } from "zod";

/** True when the runtime recognises this ISO 4217 code (e.g. "EUR"). */
function isValidCurrency(code: string): boolean {
  try {
    new Intl.NumberFormat("en", { style: "currency", currency: code });
    return true;
  } catch {
    return false;
  }
}

export const currencySchema = z.object({
  id: z.string(),
  /** ISO 4217 code, upper-case. */
  code: z.string().length(3),
  createdAt: z.string(),
});

export const createCurrencyInputSchema = z.object({
  code: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{3}$/, "Enter a 3-letter currency code, e.g. EUR")
    .refine(isValidCurrency, "Unknown currency code"),
});

export type CurrencySetting = z.infer<typeof currencySchema>;
export type CreateCurrencyInput = z.infer<typeof createCurrencyInputSchema>;
