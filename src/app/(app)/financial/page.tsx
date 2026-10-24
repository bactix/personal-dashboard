import { WidgetGrid } from "@/components/dashboard/widget-grid"
import { sectionWidgets } from "@/features/registry"

export default function FinancialDashboardPage() {
  return <WidgetGrid widgets={sectionWidgets.financial} />
}
