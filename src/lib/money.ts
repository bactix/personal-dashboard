/** Parses a user-typed amount ("12", "12.5", "1,250.75") into integer cents, or null if invalid. */
export function parseAmountToCents(input: string): number | null {
  const normalized = input.trim().replace(/,/g, "");
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null;
  const cents = Math.round(Number(normalized) * 100);
  return cents > 0 ? cents : null;
}

export function formatMoney(cents: number, currency: string): string {
  return new Intl.NumberFormat("en", { style: "currency", currency }).format(cents / 100);
}

/** Currencies the app supports. Amounts are stored as integer minor units (cents). */
export const CURRENCIES = ["USD", "LBP"] as const;
export type Currency = (typeof CURRENCIES)[number];
