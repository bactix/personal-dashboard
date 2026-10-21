import { NextResponse } from "next/server"

import { createAccount, listAccounts } from "@/features/wallets/server"
import { createAccountInputSchema } from "@/features/wallets/types"

export async function GET() {
  try {
    return NextResponse.json(await listAccounts())
  } catch (error) {
    console.error("[api/accounts GET]", error)
    return NextResponse.json({ error: "Failed to load accounts" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const parsed = createAccountInputSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }
  try {
    return NextResponse.json(await createAccount(parsed.data), { status: 201 })
  } catch (error) {
    console.error("[api/accounts POST]", error)
    return NextResponse.json({ error: "Failed to save account" }, { status: 500 })
  }
}
