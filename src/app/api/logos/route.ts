import { NextResponse } from "next/server"

import { createLogo, listLogos } from "@/features/settings/logo-server"
import { createLogoInputSchema } from "@/features/settings/logo-types"

export async function GET() {
  try {
    return NextResponse.json(await listLogos())
  } catch (error) {
    console.error("[api/logos GET]", error)
    return NextResponse.json({ error: "Failed to load logos" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const parsed = createLogoInputSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }
  try {
    return NextResponse.json(await createLogo(parsed.data), { status: 201 })
  } catch (error) {
    console.error("[api/logos POST]", error)
    return NextResponse.json({ error: "Failed to save logo" }, { status: 500 })
  }
}
