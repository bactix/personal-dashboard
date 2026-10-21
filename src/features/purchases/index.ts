import type { WidgetDefinition } from "@/types/widget";

import { PurchasesStatsWidget } from "./components/purchases-stats-widget";
import { PurchasesSummaryWidget } from "./components/purchases-summary-widget";

// Public surface of the purchases feature. Server-only code lives in ./server
// and is deliberately NOT re-exported here.
export { PurchasesPage } from "./components/purchases-page";

export const purchasesWidget: WidgetDefinition = {
  id: "purchases",
  title: "To buy",
  component: PurchasesSummaryWidget,
  size: { md: 1, xl: 1 },
};

export const purchasesStatsWidget: WidgetDefinition = {
  id: "purchases-stats",
  title: "Purchases",
  component: PurchasesStatsWidget,
  size: { md: 1, xl: 1 },
};
