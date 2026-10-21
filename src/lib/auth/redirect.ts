/** Allows only same-site relative paths, so `?next=` can't send people to another site. */
export function safeRedirectPath(next: string | null | undefined, fallback = "/"): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) {
    return fallback;
  }
  if (next === "/login" || next.startsWith("/login?")) return fallback;
  return next;
}
