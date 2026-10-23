import type { WidgetDefinition } from "@/types/widget";

import { PaymentsStatsWidget } from "./components/payments-stats-widget";

// Public surface of the payments feature (invoices + vendor bills). Server-only code
// lives in ./server and is deliberately NOT re-exported here.
export { PaymentsPage } from "./components/payments-page";

export const paymentsStatsWidget: WidgetDefinition = {
  id: "payments-stats",
  title: "Payments",
  component: PaymentsStatsWidget,
  size: { md: 1, xl: 1 },
};
