import { removeTimezone, updateTimezone } from "@/features/settings/server"
import { createTimezoneInputSchema } from "@/features/settings/types"
import { deleteResponse } from "@/lib/api/delete-route"
import { updateResponse } from "@/lib/api/update-route"

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return deleteResponse("api/timezones DELETE", () => removeTimezone(id))
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return updateResponse({
    tag: "api/timezones PUT",
    request,
    schema: createTimezoneInputSchema,
    update: (input) => updateTimezone(id, input),
  })
}
