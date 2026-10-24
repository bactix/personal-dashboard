import { z } from "zod";

/**
 * Server-only environment. Import this ONLY from Route Handlers, Server Components
 * or `features/*\/server.ts` — never from a "use client" file. Secrets must not use
 * the NEXT_PUBLIC_ prefix.
 *
 * Add every new variable here (and to .env.example) so a missing one fails loudly.
 */
const serverSchema = z.object({
  // Login (Supabase Auth, single owner): only this account's email may use the app, even if
  // someone else manages to create a Supabase user. The app fails closed without it.
  AUTH_OWNER_EMAIL: z.string().email().optional(),
  // "true" turns the login gate off (local development only; ignored in production).
  AUTH_DISABLED: z.enum(["true", "false"]).optional(),

  // Folder (relative to the project root) where the JSON file store keeps personal data
  // (only used by the one-off import into Supabase now)
  DATA_DIR: z.string().default("data"),

  // Supabase: the database behind every feature. The server uses the SECRET key (never a
  // NEXT_PUBLIC_ name); the project URL is public by design.
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  // Public by design; only used for Supabase Auth sign-in (RLS keeps it out of the data).
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(20).optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20).optional(),

  // Weather (Open-Meteo is keyless; these only choose the location shown)
  WEATHER_LOCATION_NAME: z.string().default("Beirut"),
  WEATHER_LATITUDE: z.coerce.number().min(-90).max(90).default(33.8938),
  WEATHER_LONGITUDE: z.coerce.number().min(-180).max(180).default(35.5018),
});

let cached: z.output<typeof serverSchema> | undefined;

export function getServerEnv() {
  if (!cached) {
    const result = serverSchema.safeParse(process.env);
    if (!result.success) {
      const issues = result.error.issues
        .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
        .join("; ");
      throw new Error(`Invalid environment variables — ${issues}`);
    }
    cached = result.data;
  }
  return cached;
}

/** Supabase URL + secret key for the server. Throws a clear message if either is missing. */
export function getSupabaseEnv() {
  const { NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = getServerEnv();
  if (!NEXT_PUBLIC_SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env.local");
  }
  return { url: NEXT_PUBLIC_SUPABASE_URL, secretKey: SUPABASE_SERVICE_ROLE_KEY };
}

/** Supabase URL + publishable key, for signing in. Throws a clear message if either is missing. */
export function getSupabaseAuthEnv() {
  const { NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY } = getServerEnv();
  if (!NEXT_PUBLIC_SUPABASE_URL || !NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY must be set in .env.local"
    );
  }
  return { url: NEXT_PUBLIC_SUPABASE_URL, publishableKey: NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY };
}

/** The one email allowed to sign in. Throws if it is not configured in .env.local. */
export function getAuthEnv() {
  const { AUTH_OWNER_EMAIL } = getServerEnv();
  if (!AUTH_OWNER_EMAIL) throw new Error("AUTH_OWNER_EMAIL must be set in .env.local");
  return { ownerEmail: AUTH_OWNER_EMAIL };
}
