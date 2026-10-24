import type { WidgetDefinition } from "@/types/widget";

import { contactsStatsWidget } from "./contacts";
import { debtsWidget } from "./debts";
import { exchangeRatesWidget } from "./exchange-rates";
import { helpDeskStatsWidget } from "./helpdesk";
import { metalsWidget } from "./metals";
import { projectsStatsWidget, projectsWidget } from "./projects";
import { purchasesStatsWidget } from "./purchases";
import { worldClocksListWidget, worldClocksWidget } from "./settings";
import { tasksStatsWidget, tasksWidget } from "./tasks";
import {
  transactionsHistoryWidget,
  transactionsWidget,
  walletsOverviewWidget,
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

/**
 * Dashboard widgets for each sidebar list (Financial, Work, Personal), in display order.
 * Each list's overview page renders its entry here.
 */
export const sectionWidgets = {
  financial: [
    metalsWidget,
    walletsOverviewWidget,
    debtsWidget,
    exchangeRatesWidget,
    transactionsHistoryWidget,
  ],
  work: [tasksWidget, projectsWidget, projectsStatsWidget, tasksStatsWidget, helpDeskStatsWidget],
  personal: [worldClocksListWidget, purchasesStatsWidget, contactsStatsWidget],
} satisfies Record<string, WidgetDefinition[]>;
