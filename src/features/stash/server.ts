import { createSupabaseStore } from "@/lib/storage/supabase-store";

import { stashSchema, type CreateStashInput, type StashItem } from "./types";

// Server-only: persistence for stashed items. Used by app/api/stash.

const store = createSupabaseStore({ table: "stash_items", schema: stashSchema });

/** Newest first. */
export async function listStash(): Promise<StashItem[]> {
  const items = await store.list();
  return items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function createStashItem(input: CreateStashInput): Promise<StashItem> {
  return store.create(input);
}

export function updateStashItem(id: string, input: CreateStashInput): Promise<StashItem | undefined> {
  return store.update(id, input);
}

export function removeStashItem(id: string): Promise<boolean> {
  return store.remove(id);
}
