import { NextResponse } from "next/server"

import { createAsset, listAssets } from "@/features/assets/server"
import { createAssetInputSchema } from "@/features/assets/types"

export async function GET() {
  try {
    return NextResponse.json(await listAssets())
  } catch (error) {
    console.error("[api/assets GET]", error)
    return NextResponse.json({ error: "Failed to load assets" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const parsed = createAssetInputSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }
  try {
    return NextResponse.json(await createAsset(parsed.data), { status: 201 })
  } catch (error) {
    console.error("[api/assets POST]", error)
    return NextResponse.json({ error: "Failed to save asset" }, { status: 500 })
  }
}
