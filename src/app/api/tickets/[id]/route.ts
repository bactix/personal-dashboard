import { removeTicket, updateTicket } from "@/features/helpdesk/server"
import { createTicketInputSchema } from "@/features/helpdesk/types"
import { deleteResponse } from "@/lib/api/delete-route"
import { updateResponse } from "@/lib/api/update-route"

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return deleteResponse("api/tickets DELETE", () => removeTicket(id))
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return updateResponse({
    tag: "api/tickets PUT",
    request,
    schema: createTicketInputSchema,
    update: (input) => updateTicket(id, input),
  })
}
