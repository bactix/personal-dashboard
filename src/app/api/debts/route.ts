import { NextResponse } from "next/server"

import { ContactNotFoundError, createDebt, listDebts } from "@/features/debts/server"
import { createDebtInputSchema } from "@/features/debts/types"

export async function GET() {
  try {
    return NextResponse.json(await listDebts())
  } catch (error) {
    console.error("[api/debts GET]", error)
    return NextResponse.json({ error: "Failed to load debts" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const parsed = createDebtInputSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }
  try {
    return NextResponse.json(await createDebt(parsed.data), { status: 201 })
  } catch (error) {
    if (error instanceof ContactNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    console.error("[api/debts POST]", error)
    return NextResponse.json({ error: "Failed to save debt" }, { status: 500 })
  }
}
