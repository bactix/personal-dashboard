import { NextResponse } from "next/server"

import { createStashItem, listStash } from "@/features/stash/server"
import { createStashInputSchema } from "@/features/stash/types"

export async function GET() {
  try {
    return NextResponse.json(await listStash())
  } catch (error) {
    console.error("[api/stash GET]", error)
    return NextResponse.json({ error: "Failed to load the stash" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const parsed = createStashInputSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }
  try {
    return NextResponse.json(await createStashItem(parsed.data), { status: 201 })
  } catch (error) {
    console.error("[api/stash POST]", error)
    return NextResponse.json({ error: "Failed to save the item" }, { status: 500 })
  }
}
