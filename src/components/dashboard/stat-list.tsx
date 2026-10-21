export type StatItem = { label: string; value: string }

/** Label / value rows for a stats widget. */
export function StatList({ items }: { items: StatItem[] }) {
  return (
    <dl className="flex flex-col divide-y text-sm">
      {items.map(({ label, value }) => (
        <div key={label} className="flex items-baseline justify-between gap-4 py-2 first:pt-0 last:pb-0">
          <dt className="text-muted-foreground">{label}</dt>
          <dd className="text-right font-medium tabular-nums break-words">{value}</dd>
        </div>
      ))}
    </dl>
  )
}
