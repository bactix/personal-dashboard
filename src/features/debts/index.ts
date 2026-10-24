import type { WidgetDefinition } from "@/types/widget";

import { DebtsStatsWidget } from "./components/debts-stats-widget";
import { DebtsSummaryWidget } from "./components/debts-summary-widget";

// Public surface of the debts feature. Server-only code lives in ./server
// and is deliberately NOT re-exported here.
export { DebtsPage } from "./components/debts-page";

export const debtsWidget: WidgetDefinition = {
  id: "debts",
  title: "Debts",
  component: DebtsSummaryWidget,
  size: { md: 1, xl: 1 },
};

export const debtsStatsWidget: WidgetDefinition = {
  id: "debts-stats",
  title: "Debts",
  component: DebtsStatsWidget,
  size: { md: 1, xl: 2 },
};
