import { NextResponse } from "next/server"

import { ProjectNotFoundError, createTask, listTasks } from "@/features/tasks/server"
import { createTaskInputSchema } from "@/features/tasks/types"

export async function GET() {
  try {
    return NextResponse.json(await listTasks())
  } catch (error) {
    console.error("[api/tasks GET]", error)
    return NextResponse.json({ error: "Failed to load tasks" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const parsed = createTaskInputSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }
  try {
    return NextResponse.json(await createTask(parsed.data), { status: 201 })
  } catch (error) {
    if (error instanceof ProjectNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    console.error("[api/tasks POST]", error)
    return NextResponse.json({ error: "Failed to save task" }, { status: 500 })
  }
}
