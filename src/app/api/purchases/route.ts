import { NextResponse } from "next/server"

import { createPurchaseItem, listPurchaseItems } from "@/features/purchases/server"
import { createPurchaseItemInputSchema } from "@/features/purchases/types"

export async function GET() {
  try {
    return NextResponse.json(await listPurchaseItems())
  } catch (error) {
    console.error("[api/purchases GET]", error)
    return NextResponse.json({ error: "Failed to load purchases" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const parsed = createPurchaseItemInputSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }
  try {
    return NextResponse.json(await createPurchaseItem(parsed.data), { status: 201 })
  } catch (error) {
    console.error("[api/purchases POST]", error)
    return NextResponse.json({ error: "Failed to save item" }, { status: 500 })
  }
}
