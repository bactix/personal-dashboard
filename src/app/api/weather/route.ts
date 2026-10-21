import { NextResponse } from "next/server"

import { getWeather } from "@/features/weather/server"

export async function GET() {
  try {
    return NextResponse.json(await getWeather())
  } catch (error) {
    console.error("[api/weather]", error)
    return NextResponse.json({ error: "Failed to load weather" }, { status: 502 })
  }
}
