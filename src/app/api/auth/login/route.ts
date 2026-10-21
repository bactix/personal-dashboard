import { NextResponse, type NextRequest } from "next/server"

import {
  clearFailures,
  isRateLimited,
  recordFailure,
  verifyPassword,
} from "@/features/auth/server"
import { loginInputSchema } from "@/features/auth/types"
import { SESSION_COOKIE, SESSION_MAX_AGE_SECONDS, createSessionToken } from "@/lib/auth/session"
import { getAuthEnv } from "@/lib/env"

export async function POST(request: NextRequest) {
  const parsed = loginInputSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  let secret: string
  try {
    secret = getAuthEnv().secret
  } catch (error) {
    console.error("[api/auth/login]", error)
    return NextResponse.json({ error: "Login is not configured" }, { status: 503 })
  }

  const clientKey = request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "local"
  if (isRateLimited(clientKey)) {
    return NextResponse.json({ error: "Too many attempts" }, { status: 429 })
  }

  if (!verifyPassword(parsed.data.password)) {
    recordFailure(clientKey)
    return NextResponse.json({ error: "Incorrect password" }, { status: 401 })
  }

  clearFailures(clientKey)
  const response = NextResponse.json({ ok: true })
  response.cookies.set(SESSION_COOKIE, await createSessionToken(secret), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  })
  return response
}
