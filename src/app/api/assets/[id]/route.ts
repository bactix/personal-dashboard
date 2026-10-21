import { removeAsset, updateAsset } from "@/features/assets/server"
import { createAssetInputSchema } from "@/features/assets/types"
import { deleteResponse } from "@/lib/api/delete-route"
import { updateResponse } from "@/lib/api/update-route"

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return deleteResponse("api/assets DELETE", () => removeAsset(id))
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return updateResponse({
    tag: "api/assets PUT",
    request,
    schema: createAssetInputSchema,
    update: (input) => updateAsset(id, input),
  })
}
