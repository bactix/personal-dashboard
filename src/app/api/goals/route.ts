import { NextResponse } from "next/server"

import { createGoal, listGoals } from "@/features/wallets/server"
import { createGoalInputSchema } from "@/features/wallets/types"

export async function GET() {
  try {
    return NextResponse.json(await listGoals())
  } catch (error) {
    console.error("[api/goals GET]", error)
    return NextResponse.json({ error: "Failed to load goals" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const parsed = createGoalInputSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }
  try {
    return NextResponse.json(await createGoal(parsed.data), { status: 201 })
  } catch (error) {
    console.error("[api/goals POST]", error)
    return NextResponse.json({ error: "Failed to save goal" }, { status: 500 })
  }
}
