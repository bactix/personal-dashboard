import { NextResponse } from "next/server"

import { createBudget, listBudgets } from "@/features/wallets/server"
import { createBudgetInputSchema } from "@/features/wallets/types"

export async function GET() {
  try {
    return NextResponse.json(await listBudgets())
  } catch (error) {
    console.error("[api/budgets GET]", error)
    return NextResponse.json({ error: "Failed to load budgets" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const parsed = createBudgetInputSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }
  try {
    return NextResponse.json(await createBudget(parsed.data), { status: 201 })
  } catch (error) {
    console.error("[api/budgets POST]", error)
    return NextResponse.json({ error: "Failed to save budget" }, { status: 500 })
  }
}
