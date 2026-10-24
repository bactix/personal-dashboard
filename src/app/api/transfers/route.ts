import { NextResponse } from "next/server"

import {
  InsufficientFundsError,
  TransferError,
  WalletNotFoundError,
  createTransfer,
} from "@/features/wallets/server"
import { createTransferInputSchema } from "@/features/wallets/types"

export async function POST(request: Request) {
  const parsed = createTransferInputSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }
  try {
    return NextResponse.json(await createTransfer(parsed.data), { status: 201 })
  } catch (error) {
    if (
      error instanceof WalletNotFoundError ||
      error instanceof InsufficientFundsError ||
      error instanceof TransferError
    ) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    console.error("[api/transfers POST]", error)
    return NextResponse.json({ error: "Failed to save the transfer" }, { status: 500 })
  }
}
