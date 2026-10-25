import { NextResponse } from "next/server"

import { listSubscriptionPayments } from "@/features/subscriptions/server"

export async function GET() {
  try {
    return NextResponse.json(await listSubscriptionPayments())
  } catch (error) {
    console.error("[api/subscriptions/payments GET]", error)
    return NextResponse.json({ error: "Failed to load payments" }, { status: 500 })
  }
}
