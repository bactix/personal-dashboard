import { NextResponse } from "next/server"

import { createTicket, listTickets } from "@/features/helpdesk/server"
import { createTicketInputSchema } from "@/features/helpdesk/types"

export async function GET() {
  try {
    return NextResponse.json(await listTickets())
  } catch (error) {
    console.error("[api/tickets GET]", error)
    return NextResponse.json({ error: "Failed to load tickets" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const parsed = createTicketInputSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }
  try {
    return NextResponse.json(await createTicket(parsed.data), { status: 201 })
  } catch (error) {
    console.error("[api/tickets POST]", error)
    return NextResponse.json({ error: "Failed to save ticket" }, { status: 500 })
  }
}
