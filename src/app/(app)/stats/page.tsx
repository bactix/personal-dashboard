import { WidgetGrid } from "@/components/dashboard/widget-grid"
import { statsWidgets } from "@/features/registry"

export default function StatsPage() {
  return <WidgetGrid widgets={statsWidgets} />
}
