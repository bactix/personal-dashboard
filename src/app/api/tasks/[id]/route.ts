import { ProjectNotFoundError, updateTask } from "@/features/tasks/server"
import { createTaskInputSchema } from "@/features/tasks/types"
import { updateResponse } from "@/lib/api/update-route"

import { removeTask } from "@/features/tasks/server"
import { deleteResponse } from "@/lib/api/delete-route"

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return deleteResponse("api/tasks DELETE", () => removeTask(id))
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return updateResponse({
    tag: "api/tasks PUT",
    request,
    schema: createTaskInputSchema,
    update: (input) => updateTask(id, input),
    clientErrors: [ProjectNotFoundError],
  })
}
