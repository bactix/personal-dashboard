import { NextResponse } from "next/server"

import { getExchangeRates } from "@/features/exchange-rates/server"

export async function GET() {
  try {
    return NextResponse.json(await getExchangeRates())
  } catch (error) {
    console.error("[api/exchange-rates]", error)
    return NextResponse.json({ error: "Failed to load exchange rates" }, { status: 502 })
  }
}
