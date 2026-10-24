import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/** True when the signed-in email is the one owner account (case-insensitive). */
export function isOwner(email: unknown, ownerEmail: string | undefined): boolean {
  return (
    typeof email === "string" &&
    !!ownerEmail &&
    email.trim().toLowerCase() === ownerEmail.trim().toLowerCase()
  );
}

/**
 * For `proxy.ts`: validates the Supabase session cookies (refreshing them when needed) and says
 * whether the visitor is the owner. Anyone can create a Supabase account if sign-ups are on, so a
 * valid session alone is not enough: the email must match AUTH_OWNER_EMAIL. Fails closed when
 * Supabase or the owner email is not configured. Return `response` (or copy its cookies onto a
 * redirect) so refreshed tokens reach the browser.
 */
export async function readSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return { response, authenticated: false };

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  // Nothing may run between createServerClient and getClaims, or sessions drop randomly.
  const { data } = await supabase.auth.getClaims();
  const authenticated = isOwner(data?.claims?.email, process.env.AUTH_OWNER_EMAIL);
  return { response, authenticated };
}
