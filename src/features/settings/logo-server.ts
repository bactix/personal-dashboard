import { createJsonStore } from "@/lib/storage/json-store";

import { logoSchema, type CreateLogoInput, type Logo } from "./logo-types";

// Server-only: persistence for the Personal → Logos setting (images stored inline as data URLs).

const store = createJsonStore("logos", logoSchema);

export async function listLogos(): Promise<Logo[]> {
  const items = await store.list();
  return items.sort((a, b) => a.name.localeCompare(b.name));
}

export function createLogo(input: CreateLogoInput): Promise<Logo> {
  return store.create(input);
}

export function updateLogo(id: string, input: CreateLogoInput): Promise<Logo | undefined> {
  return store.update(id, input);
}

export function removeLogo(id: string): Promise<boolean> {
  return store.remove(id);
}
