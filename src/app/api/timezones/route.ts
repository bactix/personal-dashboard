import { NextResponse } from "next/server"

import { createTimezone, listTimezones } from "@/features/settings/server"
import { createTimezoneInputSchema } from "@/features/settings/types"

export async function GET() {
  try {
    return NextResponse.json(await listTimezones())
  } catch (error) {
    console.error("[api/timezones GET]", error)
    return NextResponse.json({ error: "Failed to load time zones" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const parsed = createTimezoneInputSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }
  try {
    return NextResponse.json(await createTimezone(parsed.data), { status: 201 })
  } catch (error) {
    console.error("[api/timezones POST]", error)
    return NextResponse.json({ error: "Failed to save time zone" }, { status: 500 })
  }
}
