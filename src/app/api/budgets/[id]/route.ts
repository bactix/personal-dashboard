import { AccountNotFoundError, removeBudget, updateBudget } from "@/features/wallets/server"
import { createBudgetInputSchema } from "@/features/wallets/types"
import { deleteResponse } from "@/lib/api/delete-route"
import { updateResponse } from "@/lib/api/update-route"

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return deleteResponse("api/budgets DELETE", () => removeBudget(id))
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return updateResponse({
    tag: "api/budgets PUT",
    request,
    schema: createBudgetInputSchema,
    update: (input) => updateBudget(id, input),
    clientErrors: [AccountNotFoundError],
  })
}
