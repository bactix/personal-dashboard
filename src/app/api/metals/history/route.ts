import { NextResponse } from "next/server"

import { getMetalHistory } from "@/features/metals/server"

export async function GET() {
  try {
    return NextResponse.json(await getMetalHistory())
  } catch (error) {
    console.error("[api/metals/history]", error)
    return NextResponse.json({ error: "Failed to load metal history" }, { status: 502 })
  }
}
