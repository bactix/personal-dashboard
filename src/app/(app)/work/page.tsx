import { WidgetGrid } from "@/components/dashboard/widget-grid"
import { sectionWidgets } from "@/features/registry"

export default function WorkDashboardPage() {
  return <WidgetGrid widgets={sectionWidgets.work} />
}
