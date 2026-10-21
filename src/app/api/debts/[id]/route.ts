import { ContactNotFoundError, updateDebt } from "@/features/debts/server"
import { createDebtInputSchema } from "@/features/debts/types"
import { updateResponse } from "@/lib/api/update-route"

import { removeDebt } from "@/features/debts/server"
import { deleteResponse } from "@/lib/api/delete-route"

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return deleteResponse("api/debts DELETE", () => removeDebt(id))
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return updateResponse({
    tag: "api/debts PUT",
    request,
    schema: createDebtInputSchema,
    update: (input) => updateDebt(id, input),
    clientErrors: [ContactNotFoundError],
  })
}
