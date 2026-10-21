import type { WidgetDefinition } from "@/types/widget";

import { ContactsStatsWidget } from "./components/contacts-stats-widget";
import { ContactsSummaryWidget } from "./components/contacts-summary-widget";

// Public surface of the contacts feature. Other features may import ONLY from here
// (client-safe) or from "@/features/contacts/server" (server code).
export { ContactsPage } from "./components/contacts-page";
export { useContacts } from "./hooks";
export type { Contact } from "./types";

export const contactsWidget: WidgetDefinition = {
  id: "contacts",
  title: "Contacts",
  component: ContactsSummaryWidget,
  size: { md: 1, xl: 1 },
};

export const contactsStatsWidget: WidgetDefinition = {
  id: "contacts-stats",
  title: "Contacts",
  component: ContactsStatsWidget,
  size: { md: 1, xl: 1 },
};
