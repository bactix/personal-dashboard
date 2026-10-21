import { updateContact } from "@/features/contacts/server"
import { createContactInputSchema } from "@/features/contacts/types"
import { updateResponse } from "@/lib/api/update-route"

import { listDebts } from "@/features/debts/server"
import { removeContact } from "@/features/contacts/server"
import { deleteResponse, InUseError } from "@/lib/api/delete-route"

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return deleteResponse("api/contacts DELETE", async () => {
    // debts → contacts is the only allowed direction, so the dependency check lives here.
    if ((await listDebts()).some((debt) => debt.contactId === id)) {
      throw new InUseError("This contact has debts. Delete those first.")
    }
    return removeContact(id)
  })
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return updateResponse({
    tag: "api/contacts PUT",
    request,
    schema: createContactInputSchema,
    update: (input) => updateContact(id, input),
  })
}
