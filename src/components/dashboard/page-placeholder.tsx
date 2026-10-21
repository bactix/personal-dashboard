import { ConstructionIcon } from "lucide-react"

/** Temporary page body for a section that has no features yet. */
export function PagePlaceholder({ title }: { title: string }) {
  return (
    <div className="mx-4 flex flex-1 flex-col items-center justify-center gap-2 rounded-xl border border-dashed p-10 text-center text-muted-foreground lg:mx-6">
      <ConstructionIcon className="size-8" aria-hidden />
      <p className="text-sm">{title} is coming soon.</p>
    </div>
  )
}
