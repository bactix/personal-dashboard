import { NextResponse } from "next/server"

import { getMetalPrices } from "@/features/metals/server"

export async function GET() {
  try {
    return NextResponse.json(await getMetalPrices())
  } catch (error) {
    console.error("[api/metals]", error)
    return NextResponse.json({ error: "Failed to load metal prices" }, { status: 502 })
  }
}
