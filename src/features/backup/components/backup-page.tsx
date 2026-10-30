"use client"

import { DownloadIcon } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

import { BACKUP_MODULES, type BackupModuleId } from "../modules"

/** Data page: download an Excel backup of everything, or of the modules you tick. */
export function BackupPage() {
  const [selected, setSelected] = useState<BackupModuleId[]>([])
  const allSelected = selected.length === BACKUP_MODULES.length

  const toggle = (id: BackupModuleId, on: boolean) =>
    setSelected((current) => (on ? [...current, id] : current.filter((item) => item !== id)))

  return (
    <div className="px-4 lg:px-6">
      <Card>
        <CardHeader>
          <CardTitle>Backup</CardTitle>
          <CardDescription>
            Download your data as an Excel file with one sheet per table. Back up everything, or tick
            the modules you want.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {BACKUP_MODULES.map((module) => (
              <div key={module.id} className="flex items-center gap-2">
                <Checkbox
                  id={`backup-${module.id}`}
                  checked={selected.includes(module.id)}
                  onCheckedChange={(checked) => toggle(module.id, checked === true)}
                />
                <Label htmlFor={`backup-${module.id}`}>{module.label}</Label>
              </div>
            ))}
          </div>

          {/* Plain download links: the browser sends the login cookie and saves the file. */}
          <div className="flex flex-wrap items-center gap-2">
            <Button asChild>
              <a href="/api/backup" download>
                <DownloadIcon /> Backup everything
              </a>
            </Button>
            {selected.length > 0 ? (
              <Button asChild variant="outline">
                <a href={`/api/backup?modules=${selected.join(",")}`} download>
                  <DownloadIcon /> Backup selected ({selected.length})
                </a>
              </Button>
            ) : (
              <Button variant="outline" disabled>
                <DownloadIcon /> Backup selected
              </Button>
            )}
            <Button
              variant="ghost"
              onClick={() => setSelected(allSelected ? [] : BACKUP_MODULES.map((module) => module.id))}
            >
              {allSelected ? "Clear selection" : "Select all"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
