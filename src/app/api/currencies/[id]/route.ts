import { DuplicateCurrencyError, removeCurrency, updateCurrency } from "@/features/settings/currency-server"
import { createCurrencyInputSchema } from "@/features/settings/currency-types"
import { deleteResponse } from "@/lib/api/delete-route"
import { updateResponse } from "@/lib/api/update-route"

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return deleteResponse("api/currencies DELETE", () => removeCurrency(id))
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return updateResponse({
    tag: "api/currencies PUT",
    request,
    schema: createCurrencyInputSchema,
    update: (input) => updateCurrency(id, input),
    clientErrors: [DuplicateCurrencyError],
  })
}
