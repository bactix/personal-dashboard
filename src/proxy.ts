import { NextResponse, type NextRequest } from "next/server"

import { safeRedirectPath } from "@/lib/auth/redirect"
import { readSession } from "@/lib/auth/session"

// Gatekeeper for the whole app: everything requires a valid session except the login
// page and the auth API. Sessions are Supabase Auth cookies; fails closed when Supabase or
// AUTH_OWNER_EMAIL is missing.

const PUBLIC_PATHS = ["/login", "/api/auth/login"]

/**
 * Local-development escape hatch: AUTH_DISABLED=true in .env.local turns the login gate off.
 * Ignored in production builds, so it can't accidentally expose a deployed app.
 */
const authDisabled = process.env.AUTH_DISABLED === "true" && process.env.NODE_ENV !== "production"

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl
  const isPublic = PUBLIC_PATHS.includes(pathname)

  if (authDisabled) {
    // Nothing to sign in to: send visitors of the login page to the app.
    if (pathname === "/login") return NextResponse.redirect(new URL("/", request.url))
    return NextResponse.next()
  }

  const { response, authenticated } = await readSession(request)

  // Redirects must carry any refreshed session cookies.
  const redirectTo = (url: URL) => {
    const redirect = NextResponse.redirect(url)
    response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie))
    return redirect
  }

  if (authenticated) {
    // Logged-in users have no reason to see the login page.
    if (pathname === "/login") {
      const next = safeRedirectPath(request.nextUrl.searchParams.get("next"))
      return redirectTo(new URL(next, request.url))
    }
    return response
  }

  if (isPublic) return response

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const loginUrl = new URL("/login", request.url)
  if (pathname !== "/") loginUrl.searchParams.set("next", pathname + search)
  return redirectTo(loginUrl)
}

export const config = {
  // Skip Next internals and static files.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|gif|webp|ico)$).*)"],
}
