import { updateProject } from "@/features/projects/server"
import { createProjectInputSchema } from "@/features/projects/types"
import { updateResponse } from "@/lib/api/update-route"

import { removeProject } from "@/features/projects/server"
import { listTasks } from "@/features/tasks/server"
import { deleteResponse, InUseError } from "@/lib/api/delete-route"

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return deleteResponse("api/projects DELETE", async () => {
    // tasks → projects is the only allowed direction, so the dependency check lives here.
    if ((await listTasks()).some((task) => task.projectId === id)) {
      throw new InUseError("This project has tasks. Delete those first.")
    }
    return removeProject(id)
  })
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return updateResponse({
    tag: "api/projects PUT",
    request,
    schema: createProjectInputSchema,
    update: (input) => updateProject(id, input),
  })
}
