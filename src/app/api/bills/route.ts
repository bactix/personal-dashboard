import { NextResponse } from "next/server"

import { createBill, listBills } from "@/features/accounting/server"
import { createBillInputSchema } from "@/features/accounting/types"

export async function GET() {
  try {
    return NextResponse.json(await listBills())
  } catch (error) {
    console.error("[api/bills GET]", error)
    return NextResponse.json({ error: "Failed to load bills" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const parsed = createBillInputSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }
  try {
    return NextResponse.json(await createBill(parsed.data), { status: 201 })
  } catch (error) {
    console.error("[api/bills POST]", error)
    return NextResponse.json({ error: "Failed to save bill" }, { status: 500 })
  }
}
