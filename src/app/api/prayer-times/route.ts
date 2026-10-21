import { NextResponse } from "next/server"

import { getPrayerTimes } from "@/features/prayer-times/server"

export async function GET() {
  try {
    return NextResponse.json(await getPrayerTimes())
  } catch (error) {
    console.error("[api/prayer-times]", error)
    return NextResponse.json({ error: "Failed to load prayer times" }, { status: 502 })
  }
}
