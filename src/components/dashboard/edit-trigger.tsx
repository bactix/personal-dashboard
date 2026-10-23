import { PencilIcon } from "lucide-react"
import type { ComponentProps } from "react"

import { Button } from "@/components/ui/button"

/**
 * Pencil icon button used as the `DialogTrigger` of an edit dialog (pair with `asChild`).
 * It must forward the props (onClick, ref, data-state…) that `DialogTrigger` injects,
 * otherwise clicking it does nothing.
 */
export function EditTrigger({
  itemLabel,
  ...props
}: { itemLabel: string } & Omit<ComponentProps<typeof Button>, "children">) {
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label={`Edit ${itemLabel}`}
      className="text-muted-foreground"
      {...props}
    >
      <PencilIcon />
    </Button>
  )
}
