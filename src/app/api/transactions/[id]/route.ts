import { BudgetMismatchError, BudgetNotFoundError, WalletNotFoundError, updateTransaction } from "@/features/wallets/server"
import { createTransactionInputSchema } from "@/features/wallets/types"
import { updateResponse } from "@/lib/api/update-route"

import { removeTransaction } from "@/features/wallets/server"
import { deleteResponse } from "@/lib/api/delete-route"

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return deleteResponse("api/transactions DELETE", () => removeTransaction(id))
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return updateResponse({
    tag: "api/transactions PUT",
    request,
    schema: createTransactionInputSchema,
    update: (input) => updateTransaction(id, input),
    clientErrors: [WalletNotFoundError, BudgetNotFoundError, BudgetMismatchError],
  })
}
