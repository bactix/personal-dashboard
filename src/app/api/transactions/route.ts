import { NextResponse } from "next/server"

import {
  AccountNotFoundError,
  InsufficientFundsError,
  WalletNotFoundError,
  createTransaction,
  listTransactions,
} from "@/features/wallets/server"
import { createTransactionInputSchema } from "@/features/wallets/types"

export async function GET() {
  try {
    return NextResponse.json(await listTransactions())
  } catch (error) {
    console.error("[api/transactions GET]", error)
    return NextResponse.json({ error: "Failed to load transactions" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const parsed = createTransactionInputSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }
  try {
    return NextResponse.json(await createTransaction(parsed.data), { status: 201 })
  } catch (error) {
    if (
      error instanceof WalletNotFoundError ||
      error instanceof AccountNotFoundError ||
      error instanceof InsufficientFundsError
    ) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    console.error("[api/transactions POST]", error)
    return NextResponse.json({ error: "Failed to save transaction" }, { status: 500 })
  }
}
