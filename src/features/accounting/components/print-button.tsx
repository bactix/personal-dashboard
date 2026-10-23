"use client"

import { PrinterIcon } from "lucide-react"

import { Button } from "@/components/ui/button"

/** Icon button that runs `onPrint`; the browser's print dialog offers "Save as PDF". */
export function PrintButton({ itemLabel, onPrint }: { itemLabel: string; onPrint: () => void }) {
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label={`Print ${itemLabel} as PDF`}
      title="Print / save as PDF"
      className="text-muted-foreground"
      onClick={onPrint}
    >
      <PrinterIcon />
    </Button>
  )
}
