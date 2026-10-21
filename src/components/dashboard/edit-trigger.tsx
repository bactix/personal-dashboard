import { PencilIcon } from "lucide-react"

import { Button } from "@/components/ui/button"

/** Pencil icon button used as the `DialogTrigger` of an edit dialog (pair with `asChild`). */
export function EditTrigger({ itemLabel }: { itemLabel: string }) {
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label={`Edit ${itemLabel}`}
      className="text-muted-foreground"
    >
      <PencilIcon />
    </Button>
  )
}
