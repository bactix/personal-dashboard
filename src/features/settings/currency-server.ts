import { CURRENCIES } from "@/lib/money";
import { createJsonStore } from "@/lib/storage/json-store";

import { currencySchema, type CreateCurrencyInput, type CurrencySetting } from "./currency-types";

// Server-only: persistence for the currencies setting.

const store = createJsonStore("currencies", currencySchema);

/** Thrown when the code is already in the list; routes map it to a 400. */
export class DuplicateCurrencyError extends Error {
  constructor(code: string) {
    super(`${code} is already in the list`);
    this.name = "DuplicateCurrencyError";
  }
}

/** Lists currencies; an empty list is seeded with the app defaults so there is always one. */
export async function listCurrencies(): Promise<CurrencySetting[]> {
  let items = await store.list();
  if (items.length === 0) {
    for (const code of CURRENCIES) await store.create({ code });
    items = await store.list();
  }
  return items.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

async function assertUnique(code: string, exceptId?: string) {
  const items = await store.list();
  if (items.some((item) => item.code === code && item.id !== exceptId)) {
    throw new DuplicateCurrencyError(code);
  }
}

export async function createCurrency(input: CreateCurrencyInput): Promise<CurrencySetting> {
  await assertUnique(input.code);
  return store.create(input);
}

export async function updateCurrency(
  id: string,
  input: CreateCurrencyInput
): Promise<CurrencySetting | undefined> {
  await assertUnique(input.code, id);
  return store.update(id, input);
}

export function removeCurrency(id: string): Promise<boolean> {
  return store.remove(id);
}
