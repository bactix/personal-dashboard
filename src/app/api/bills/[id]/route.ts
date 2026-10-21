import { removeBill, updateBill } from "@/features/payments/server"
import { createBillInputSchema } from "@/features/payments/types"
import { deleteResponse } from "@/lib/api/delete-route"
import { updateResponse } from "@/lib/api/update-route"

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return deleteResponse("api/bills DELETE", () => removeBill(id))
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return updateResponse({
    tag: "api/bills PUT",
    request,
    schema: createBillInputSchema,
    update: (input) => updateBill(id, input),
  })
}
