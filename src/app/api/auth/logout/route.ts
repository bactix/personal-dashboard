import { NextResponse } from "next/server";

import { createSupabaseAuthClient } from "@/lib/supabase/server";

export async function POST() {
  try {
    const supabase = await createSupabaseAuthClient();
    await supabase.auth.signOut();
  } catch (error) {
    console.error("[api/auth/logout]", error);
  }
  return NextResponse.json({ ok: true });
}
