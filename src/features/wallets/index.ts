import type { WidgetDefinition } from "@/types/widget";

import { AccountsStatsWidget } from "./components/accounts-stats-widget";
import { BudgetsStatsWidget } from "./components/budgets-stats-widget";
import { GoalsStatsWidget } from "./components/goals-stats-widget";
import { TransactionsStatsWidget } from "./components/transactions-stats-widget";
import { TransactionsSummaryWidget } from "./components/transactions-summary-widget";
import { WalletsStatsWidget } from "./components/wallets-stats-widget";
import { WalletsSummaryWidget } from "./components/wallets-summary-widget";

// Public surface of the wallets feature (wallets + their transactions live together
// because balances are derived from transactions). Server-only code lives in ./server
// and is deliberately NOT re-exported here.
export { AccountsPage } from "./components/accounts-page";
export { BudgetsPage } from "./components/budgets-page";
export { GoalsPage } from "./components/goals-page";
export { TransactionsPage } from "./components/transactions-page";
export { WalletsPage } from "./components/wallets-page";

export const walletsWidget: WidgetDefinition = {
  id: "wallets",
  title: "Wallets",
  component: WalletsSummaryWidget,
  size: { md: 1, xl: 1 },
};

const statsSize = { md: 1, xl: 1 } as const;

export const walletsStatsWidget: WidgetDefinition = {
  id: "wallets-stats",
  title: "Wallets",
  component: WalletsStatsWidget,
  size: statsSize,
};

export const accountsStatsWidget: WidgetDefinition = {
  id: "accounts-stats",
  title: "Accounts",
  component: AccountsStatsWidget,
  size: statsSize,
};

export const transactionsStatsWidget: WidgetDefinition = {
  id: "transactions-stats",
  title: "Transactions",
  component: TransactionsStatsWidget,
  size: statsSize,
};

export const goalsStatsWidget: WidgetDefinition = {
  id: "goals-stats",
  title: "Goals",
  component: GoalsStatsWidget,
  size: statsSize,
};

export const budgetsStatsWidget: WidgetDefinition = {
  id: "budgets-stats",
  title: "Budgets",
  component: BudgetsStatsWidget,
  size: statsSize,
};

export const transactionsWidget: WidgetDefinition = {
  id: "transactions",
  title: "Transactions",
  component: TransactionsSummaryWidget,
  size: { md: 1, xl: 1 },
};
