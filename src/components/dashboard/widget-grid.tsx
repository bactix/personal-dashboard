import { SortableWidgetGrid } from "@/components/dashboard/sortable-widget-grid"
import { WidgetErrorBoundary } from "@/components/dashboard/widget-error-boundary"
import { cn } from "@/lib/utils"
import type { WidgetDefinition, WidgetSize } from "@/types/widget"

// Full class names must appear literally so Tailwind can detect them.
const MD_SPAN = { 1: "md:col-span-1", 2: "md:col-span-2" } as const
const XL_SPAN = {
  1: "xl:col-span-1",
  2: "xl:col-span-2",
  3: "xl:col-span-3",
  4: "xl:col-span-4",
} as const

const XL_ROWS = { 1: "xl:row-span-1", 2: "xl:row-span-2" } as const

function spanClasses({ md = 1, xl = 1, rows = 1 }: WidgetSize = {}) {
  return cn(MD_SPAN[md], XL_SPAN[xl], XL_ROWS[rows])
}

/**
 * Responsive grid: 1 column on mobile, 2 on md, 4 on xl. Tiles can be dragged into a new order,
 * remembered per `storageKey` (one per dashboard page). Renders purely from widget definitions —
 * never hard-code widgets here. The widgets are rendered here (server side) and handed to the
 * client grid as elements, because component references can't cross that boundary.
 */
export function WidgetGrid({ widgets, storageKey }: { widgets: WidgetDefinition[]; storageKey: string }) {
  const items = widgets
    .filter((widget) => widget.enabled !== false)
    .map(({ id, title, component: Widget, size }) => ({
      id,
      title,
      className: spanClasses(size),
      content: (
        <WidgetErrorBoundary title={title}>
          <Widget />
        </WidgetErrorBoundary>
      ),
    }))

  return <SortableWidgetGrid storageKey={storageKey} items={items} />
}
