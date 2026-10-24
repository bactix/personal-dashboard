import { NextResponse } from "next/server"

import { createSubscription, listSubscriptions } from "@/features/subscriptions/server"
import { createSubscriptionInputSchema } from "@/features/subscriptions/types"

export async function GET() {
  try {
    return NextResponse.json(await listSubscriptions())
  } catch (error) {
    console.error("[api/subscriptions GET]", error)
    return NextResponse.json({ error: "Failed to load subscriptions" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const parsed = createSubscriptionInputSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }
  try {
    return NextResponse.json(await createSubscription(parsed.data), { status: 201 })
  } catch (error) {
    console.error("[api/subscriptions POST]", error)
    return NextResponse.json({ error: "Failed to save subscription" }, { status: 500 })
  }
}
