import { z } from "zod";

/**
 * Server-only environment. Import this ONLY from Route Handlers, Server Components
 * or `features/*\/server.ts` — never from a "use client" file. Secrets must not use
 * the NEXT_PUBLIC_ prefix.
 *
 * Add every new variable here (and to .env.example) so a missing one fails loudly.
 */
const serverSchema = z.object({
  // Login (single owner). Both required for sign-in; the app fails closed without them.
  AUTH_PASSWORD: z.string().min(8).optional(),
  AUTH_SECRET: z.string().min(32).optional(),
  // "true" turns the login gate off (local development only; ignored in production).
  AUTH_DISABLED: z.enum(["true", "false"]).optional(),

  // Folder (relative to the project root) where the JSON file store keeps personal data
  // (only used by the one-off import into Supabase now)
  DATA_DIR: z.string().default("data"),

  // Supabase: the database behind every feature. The server uses the SECRET key (never a
  // NEXT_PUBLIC_ name); the project URL is public by design.
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
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

/** Credentials for the login page. Throws if they are not configured in .env.local. */
export function getAuthEnv() {
  const { AUTH_PASSWORD, AUTH_SECRET } = getServerEnv();
  if (!AUTH_PASSWORD || !AUTH_SECRET) {
    throw new Error("AUTH_PASSWORD and AUTH_SECRET must be set in .env.local");
  }
  return { password: AUTH_PASSWORD, secret: AUTH_SECRET };
}
