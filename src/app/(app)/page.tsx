import { WidgetGrid } from "@/components/dashboard/widget-grid"
import { widgets } from "@/features/registry"

export default function HomePage() {
  return <WidgetGrid widgets={widgets} />
}
