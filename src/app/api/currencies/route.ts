import { NextResponse } from "next/server"

import {
  createCurrency,
  DuplicateCurrencyError,
  listCurrencies,
} from "@/features/settings/currency-server"
import { createCurrencyInputSchema } from "@/features/settings/currency-types"

export async function GET() {
  try {
    return NextResponse.json(await listCurrencies())
  } catch (error) {
    console.error("[api/currencies GET]", error)
    return NextResponse.json({ error: "Failed to load currencies" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const parsed = createCurrencyInputSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }
  try {
    return NextResponse.json(await createCurrency(parsed.data), { status: 201 })
  } catch (error) {
    if (error instanceof DuplicateCurrencyError) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    console.error("[api/currencies POST]", error)
    return NextResponse.json({ error: "Failed to save currency" }, { status: 500 })
  }
}
