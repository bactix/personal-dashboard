import { NextResponse } from "next/server"

import { createContact, listContacts } from "@/features/contacts/server"
import { createContactInputSchema } from "@/features/contacts/types"

export async function GET() {
  try {
    return NextResponse.json(await listContacts())
  } catch (error) {
    console.error("[api/contacts GET]", error)
    return NextResponse.json({ error: "Failed to load contacts" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const parsed = createContactInputSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }
  try {
    return NextResponse.json(await createContact(parsed.data), { status: 201 })
  } catch (error) {
    console.error("[api/contacts POST]", error)
    return NextResponse.json({ error: "Failed to save contact" }, { status: 500 })
  }
}
