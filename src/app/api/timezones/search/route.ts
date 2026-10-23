import { NextResponse } from "next/server"

import { searchCities } from "@/features/settings/server"

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q")?.trim() ?? ""
  if (query.length < 2 || query.length > 60) return NextResponse.json([])
  try {
    return NextResponse.json(await searchCities(query))
  } catch (error) {
    console.error("[api/timezones/search GET]", error)
    return NextResponse.json({ error: "Failed to search cities" }, { status: 502 })
  }
}
