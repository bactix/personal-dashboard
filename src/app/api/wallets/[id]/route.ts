import { updateWallet } from "@/features/wallets/server"
import { createWalletInputSchema } from "@/features/wallets/types"
import { updateResponse } from "@/lib/api/update-route"

import { removeWallet } from "@/features/wallets/server"
import { deleteResponse } from "@/lib/api/delete-route"

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return deleteResponse("api/wallets DELETE", () => removeWallet(id))
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return updateResponse({
    tag: "api/wallets PUT",
    request,
    schema: createWalletInputSchema,
    update: (input) => updateWallet(id, input),
  })
}
