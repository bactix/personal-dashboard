import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { getSupabaseAuthEnv } from "@/lib/env";

// Server-only: a Supabase client that acts as the signed-in visitor (publishable key + the
// session cookies), used by the login and logout routes. Data access still goes through
// `admin.ts`. Create a new client per request; never keep one in a module variable.

export async function createSupabaseAuthClient() {
  const cookieStore = await cookies();
  const { url, publishableKey } = getSupabaseAuthEnv();

  return createServerClient(url, publishableKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
      },
    },
  });
}
