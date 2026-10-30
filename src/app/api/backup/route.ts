import { NextResponse } from "next/server"

import { BACKUP_MODULES, isBackupModuleId } from "@/features/backup/modules"
import { createBackup } from "@/features/backup/server"

/** GET /api/backup?modules=wallets,debts — omit `modules` to back up everything. */
export async function GET(request: Request) {
  const param = new URL(request.url).searchParams.get("modules")
  const requested = param ? param.split(",").filter(Boolean) : BACKUP_MODULES.map((module) => module.id)
  if (requested.length === 0 || !requested.every(isBackupModuleId)) {
    return NextResponse.json({ error: "Unknown module" }, { status: 400 })
  }

  try {
    const file = await createBackup(requested)
    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")
    const scope = param ? "partial" : "full"
    return new NextResponse(new Uint8Array(file), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="dashboard-backup-${scope}-${stamp}.xlsx"`,
        "Cache-Control": "no-store",
      },
    })
  } catch (error) {
    console.error("[api/backup GET]", error)
    return NextResponse.json({ error: "Failed to create the backup" }, { status: 502 })
  }
}
