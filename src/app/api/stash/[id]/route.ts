import { removeStashItem, updateStashItem } from "@/features/stash/server"
import { createStashInputSchema } from "@/features/stash/types"
import { deleteResponse } from "@/lib/api/delete-route"
import { updateResponse } from "@/lib/api/update-route"

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return deleteResponse("api/stash DELETE", () => removeStashItem(id))
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return updateResponse({
    tag: "api/stash PUT",
    request,
    schema: createStashInputSchema,
    update: (input) => updateStashItem(id, input),
  })
}
