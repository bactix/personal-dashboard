import { createSupabaseStore } from "@/lib/storage/supabase-store";

import { assetSchema, type Asset, type CreateAssetInput } from "./types";

// Server-only: persistence for assets. Used by app/api/assets.

const store = createSupabaseStore({ table: "assets", schema: assetSchema });

/** Most valuable first. */
export async function listAssets(): Promise<Asset[]> {
  const all = await store.list();
  return all.sort((a, b) => b.currentValueCents - a.currentValueCents || a.name.localeCompare(b.name));
}

export function createAsset(input: CreateAssetInput): Promise<Asset> {
  return store.create(input);
}

export function updateAsset(id: string, input: CreateAssetInput): Promise<Asset | undefined> {
  return store.update(id, input);
}

export function removeAsset(id: string): Promise<boolean> {
  return store.remove(id);
}
