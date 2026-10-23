import { NextResponse } from "next/server"

import { createInvoice, listInvoices } from "@/features/accounting/server"
import { createInvoiceInputSchema } from "@/features/accounting/types"

export async function GET() {
  try {
    return NextResponse.json(await listInvoices())
  } catch (error) {
    console.error("[api/invoices GET]", error)
    return NextResponse.json({ error: "Failed to load invoices" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const parsed = createInvoiceInputSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }
  try {
    return NextResponse.json(await createInvoice(parsed.data), { status: 201 })
  } catch (error) {
    console.error("[api/invoices POST]", error)
    return NextResponse.json({ error: "Failed to save invoice" }, { status: 500 })
  }
}
