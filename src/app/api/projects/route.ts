import { NextResponse } from "next/server"

import { createProject, listProjects } from "@/features/projects/server"
import { createProjectInputSchema } from "@/features/projects/types"

export async function GET() {
  try {
    return NextResponse.json(await listProjects())
  } catch (error) {
    console.error("[api/projects GET]", error)
    return NextResponse.json({ error: "Failed to load projects" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const parsed = createProjectInputSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }
  try {
    return NextResponse.json(await createProject(parsed.data), { status: 201 })
  } catch (error) {
    console.error("[api/projects POST]", error)
    return NextResponse.json({ error: "Failed to save project" }, { status: 500 })
  }
}
