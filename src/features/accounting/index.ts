import type { WidgetDefinition } from "@/types/widget";

import { AccountingStatsWidget } from "./components/accounting-stats-widget";

// Public surface of the accounting feature (invoices + vendor bills, one page each).
// Server-only code lives in ./server and is deliberately NOT re-exported here.
export { BillsPage } from "./components/bills-page";
export { InvoicesPage } from "./components/invoices-page";
export { useBills, useInvoices } from "./hooks";
export { billOutstandingCents, invoiceOutstandingCents } from "./totals";
export type { Bill, Invoice } from "./types";

export const accountingStatsWidget: WidgetDefinition = {
  id: "accounting-stats",
  title: "Accounting",
  component: AccountingStatsWidget,
  size: { md: 1, xl: 1 },
};
