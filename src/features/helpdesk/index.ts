import type { WidgetDefinition } from "@/types/widget";

import { HelpDeskStatsWidget } from "./components/helpdesk-stats-widget";

// Public surface of the help desk feature. Server-only code lives in ./server
// and is deliberately NOT re-exported here.
export { HelpDeskPage } from "./components/helpdesk-page";

export const helpDeskStatsWidget: WidgetDefinition = {
  id: "helpdesk-stats",
  title: "Help desk",
  component: HelpDeskStatsWidget,
  size: { md: 1, xl: 1 },
};
