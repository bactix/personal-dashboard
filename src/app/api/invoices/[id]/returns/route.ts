import { addInvoiceReturn, LimitExceededError } from "@/features/accounting/server"
import { createReturnInputSchema } from "@/features/accounting/types"
import { updateResponse } from "@/lib/api/update-route"

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return updateResponse({
    tag: "api/invoices/returns POST",
    request,
    schema: createReturnInputSchema,
    update: (input) => addInvoiceReturn(id, input),
    clientErrors: [LimitExceededError],
  })
}
