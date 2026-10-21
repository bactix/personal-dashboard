import { createJsonStore } from "@/lib/storage/json-store";

import { purchaseItemSchema, type CreatePurchaseItemInput, type PurchaseItem } from "./types";

// Server-only: persistence for the buy-later list. Used by app/api/purchases.

const store = createJsonStore("purchases", purchaseItemSchema);

export async function listPurchaseItems(): Promise<PurchaseItem[]> {
  const items = await store.list();
  return items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function createPurchaseItem(input: CreatePurchaseItemInput): Promise<PurchaseItem> {
  return store.create(input);
}

export function removePurchaseItem(id: string): Promise<boolean> {
  return store.remove(id);
}

export function updatePurchaseItem(
  id: string,
  input: CreatePurchaseItemInput
): Promise<PurchaseItem | undefined> {
  return store.update(id, input);
}
