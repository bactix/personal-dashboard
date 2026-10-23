import { removeInvoice, LimitExceededError, updateInvoice } from "@/features/accounting/server"
import { createInvoiceInputSchema } from "@/features/accounting/types"
import { deleteResponse } from "@/lib/api/delete-route"
import { updateResponse } from "@/lib/api/update-route"

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return deleteResponse("api/invoices DELETE", () => removeInvoice(id))
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return updateResponse({
    tag: "api/invoices PUT",
    request,
    schema: createInvoiceInputSchema,
    update: (input) => updateInvoice(id, input),
    clientErrors: [LimitExceededError],
  })
}
