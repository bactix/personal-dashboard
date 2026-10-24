import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { getSupabaseEnv } from "@/lib/env";

// Server-only: a Supabase client that uses the SECRET key, so it bypasses Row Level Security.
// That is intentional (single owner, behind the app's own login); the publishable key in the
// browser stays locked out by RLS. Never import this from a "use client" file.

let cached: SupabaseClient | undefined;

export function getSupabaseAdmin(): SupabaseClient {
  if (!cached) {
    const { url, secretKey } = getSupabaseEnv();
    cached = createClient(url, secretKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      // Always read fresh data: Next must not cache these requests.
      global: { fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }) },
    });
  }
  return cached;
}
