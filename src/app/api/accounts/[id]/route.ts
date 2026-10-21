import { updateAccount } from "@/features/wallets/server"
import { createAccountInputSchema } from "@/features/wallets/types"
import { updateResponse } from "@/lib/api/update-route"

import { removeAccount } from "@/features/wallets/server"
import { deleteResponse } from "@/lib/api/delete-route"

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return deleteResponse("api/accounts DELETE", () => removeAccount(id))
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return updateResponse({
    tag: "api/accounts PUT",
    request,
    schema: createAccountInputSchema,
    update: (input) => updateAccount(id, input),
  })
}
