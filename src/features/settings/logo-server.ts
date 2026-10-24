import { createSupabaseStore } from "@/lib/storage/supabase-store";

import { logoSchema, type CreateLogoInput, type Logo } from "./logo-types";

// Server-only: persistence for the Personal → Logos setting (images stored as bytes in Supabase).

/**
 * The app keeps a logo's image as a base64 data URL; the database keeps its bytes (`image` bytea)
 * and type (`mime_type`). PostgREST reads and writes bytea as a "\x<hex>" string.
 */
const store = createSupabaseStore({
  table: "logos",
  schema: logoSchema,
  readFix(candidate, raw) {
    const hex = String(raw.image ?? "").replace(/^\\x/, "");
    candidate.image = `data:${String(raw.mime_type)};base64,${Buffer.from(hex, "hex").toString("base64")}`;
  },
  writeFix(row, input) {
    const match = /^data:([^;]+);base64,([\s\S]*)$/.exec(input.image);
    if (!match) throw new Error("Logo image must be a base64 data URL");
    row.mime_type = match[1];
    row.image = `\\x${Buffer.from(match[2], "base64").toString("hex")}`;
  },
});

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
