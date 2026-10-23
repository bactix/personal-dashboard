import type { WidgetDefinition } from "@/types/widget";

import { accountingStatsWidget } from "./accounting";
import { assetsStatsWidget } from "./assets";
import { contactsStatsWidget } from "./contacts";
import { debtsStatsWidget } from "./debts";
import { helpDeskStatsWidget } from "./helpdesk";
import { projectsStatsWidget, projectsWidget } from "./projects";
import { purchasesStatsWidget } from "./purchases";
import { worldClocksWidget } from "./settings";
import { tasksStatsWidget, tasksWidget } from "./tasks";
import {
  accountsStatsWidget,
  budgetsStatsWidget,
  goalsStatsWidget,
  transactionsStatsWidget,
  transactionsWidget,
  walletsStatsWidget,
  walletsWidget,
} from "./wallets";

/**
 * Home-screen widgets, in display order. Add a new feature by importing its
 * definition here. (Weather, and the Debts, To buy and Contacts tiles, still exist in their features but are not registered.)
 */
export const widgets: WidgetDefinition[] = [
  tasksWidget,
  projectsWidget,
  walletsWidget,
  transactionsWidget,
  worldClocksWidget,
];

/** Widgets for the Stats page, in display order. */
export const statsWidgets: WidgetDefinition[] = [
  debtsStatsWidget,
  walletsStatsWidget,
  accountsStatsWidget,
  transactionsStatsWidget,
  goalsStatsWidget,
  budgetsStatsWidget,
  assetsStatsWidget,
  accountingStatsWidget,
  projectsStatsWidget,
  tasksStatsWidget,
  helpDeskStatsWidget,
  purchasesStatsWidget,
  contactsStatsWidget,
];
