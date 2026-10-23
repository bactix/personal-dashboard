import { removeLogo, updateLogo } from "@/features/settings/logo-server"
import { createLogoInputSchema } from "@/features/settings/logo-types"
import { deleteResponse } from "@/lib/api/delete-route"
import { updateResponse } from "@/lib/api/update-route"

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return deleteResponse("api/logos DELETE", () => removeLogo(id))
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return updateResponse({
    tag: "api/logos PUT",
    request,
    schema: createLogoInputSchema,
    update: (input) => updateLogo(id, input),
  })
}
