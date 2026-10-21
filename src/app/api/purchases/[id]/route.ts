import { updatePurchaseItem } from "@/features/purchases/server"
import { createPurchaseItemInputSchema } from "@/features/purchases/types"
import { updateResponse } from "@/lib/api/update-route"

import { removePurchaseItem } from "@/features/purchases/server"
import { deleteResponse } from "@/lib/api/delete-route"

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return deleteResponse("api/purchases DELETE", () => removePurchaseItem(id))
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return updateResponse({
    tag: "api/purchases PUT",
    request,
    schema: createPurchaseItemInputSchema,
    update: (input) => updatePurchaseItem(id, input),
  })
}
