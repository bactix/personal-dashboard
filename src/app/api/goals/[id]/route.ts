import { removeGoal, updateGoal } from "@/features/wallets/server"
import { createGoalInputSchema } from "@/features/wallets/types"
import { deleteResponse } from "@/lib/api/delete-route"
import { updateResponse } from "@/lib/api/update-route"

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return deleteResponse("api/goals DELETE", () => removeGoal(id))
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return updateResponse({
    tag: "api/goals PUT",
    request,
    schema: createGoalInputSchema,
    update: (input) => updateGoal(id, input),
  })
}
