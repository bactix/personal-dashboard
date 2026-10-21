import type { z } from "zod";

import { ApiError } from "./errors";

export type HttpOptions = Omit<RequestInit, "signal" | "body"> & {
  /** JSON request body; sets the Content-Type header for you. */
  json?: unknown;
  /** Abort the request after this many ms. */
  timeoutMs?: number;
  /** Query-string params; undefined values are skipped. */
  params?: Record<string, string | number | boolean | undefined>;
};

const DEFAULT_TIMEOUT_MS = 10_000;

function buildUrl(url: string, params: HttpOptions["params"]): string {
  if (!params) return url;
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) search.set(key, String(value));
  }
  const query = search.toString();
  if (!query) return url;
  return url + (url.includes("?") ? "&" : "?") + query;
}

/**
 * The single way the app talks to any HTTP API (third-party or our own /api routes).
 * Adds a timeout, throws typed ApiErrors, and validates the payload against a Zod schema.
 */
export async function http<S extends z.ZodType>(
  url: string,
  schema: S,
  { timeoutMs = DEFAULT_TIMEOUT_MS, params, json: jsonBody, headers, ...init }: HttpOptions = {}
): Promise<z.output<S>> {
  let response: Response;
  try {
    response = await fetch(buildUrl(url, params), {
      ...init,
      headers:
        jsonBody === undefined
          ? headers
          : { "Content-Type": "application/json", ...headers },
      body: jsonBody === undefined ? undefined : JSON.stringify(jsonBody),
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (error) {
    const timedOut = error instanceof DOMException && error.name === "TimeoutError";
    throw new ApiError(
      timedOut ? `Request timed out after ${timeoutMs}ms` : "Network request failed",
      timedOut ? "timeout" : "network",
      { cause: error }
    );
  }

  if (!response.ok) {
    // Our own routes reply `{ error: "<message>" }`; surface it so forms can show it.
    const body: unknown = await response.json().catch(() => null);
    const detail =
      body && typeof body === "object" && "error" in body && typeof body.error === "string"
        ? body.error
        : undefined;
    throw new ApiError(detail ?? `Request failed with status ${response.status}`, "http", {
      status: response.status,
    });
  }

  let json: unknown;
  try {
    json = await response.json();
  } catch (error) {
    throw new ApiError("Response was not valid JSON", "invalid-response", { cause: error });
  }

  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    throw new ApiError("Response did not match the expected shape", "invalid-response", {
      cause: parsed.error,
    });
  }
  return parsed.data;
}
