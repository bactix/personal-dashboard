import type { ReactNode } from "react"

/** A settings block: full-width heading band with its content underneath. */
export function SettingsSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={`settings-${title}`}>
      <h2 id={`settings-${title}`} className="bg-muted px-4 py-2.5 text-sm font-semibold">
        {title}
      </h2>
      <div className="px-4 py-6">{children}</div>
    </section>
  )
}
