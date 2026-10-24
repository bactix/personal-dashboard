import { NextResponse, type NextRequest } from "next/server";

import { clearFailures, isRateLimited, recordFailure } from "@/features/auth/server";
import { loginInputSchema } from "@/features/auth/types";
import { isOwner } from "@/lib/auth/session";
import { getAuthEnv } from "@/lib/env";
import { createSupabaseAuthClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const parsed = loginInputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  let ownerEmail: string;
  try {
    ownerEmail = getAuthEnv().ownerEmail;
  } catch (error) {
    console.error("[api/auth/login]", error);
    return NextResponse.json({ error: "Login is not configured" }, { status: 503 });
  }

  const clientKey = request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "local";
  if (isRateLimited(clientKey)) {
    return NextResponse.json({ error: "Too many attempts" }, { status: 429 });
  }

  // Same answer for a wrong email and a wrong password.
  const reject = () => {
    recordFailure(clientKey);
    return NextResponse.json({ error: "Incorrect email or password" }, { status: 401 });
  };
  if (!isOwner(parsed.data.email, ownerEmail)) return reject();

  let supabase;
  try {
    supabase = await createSupabaseAuthClient();
  } catch (error) {
    console.error("[api/auth/login]", error);
    return NextResponse.json({ error: "Login is not configured" }, { status: 503 });
  }

  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    if (error.status && error.status >= 500) {
      console.error("[api/auth/login]", error);
      return NextResponse.json({ error: "Could not reach the sign-in service" }, { status: 502 });
    }
    return reject();
  }

  clearFailures(clientKey);
  return NextResponse.json({ ok: true });
}
