import { NextResponse } from "next/server"

import { createWallet, listWallets } from "@/features/wallets/server"
import { createWalletInputSchema } from "@/features/wallets/types"

export async function GET() {
  try {
    return NextResponse.json(await listWallets())
  } catch (error) {
    console.error("[api/wallets GET]", error)
    return NextResponse.json({ error: "Failed to load wallets" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const parsed = createWalletInputSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }
  try {
    return NextResponse.json(await createWallet(parsed.data), { status: 201 })
  } catch (error) {
    console.error("[api/wallets POST]", error)
    return NextResponse.json({ error: "Failed to save wallet" }, { status: 500 })
  }
}
