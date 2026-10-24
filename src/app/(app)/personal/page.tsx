import { WidgetGrid } from "@/components/dashboard/widget-grid"
import { sectionWidgets } from "@/features/registry"

export default function PersonalDashboardPage() {
  return <WidgetGrid widgets={sectionWidgets.personal} />
}
