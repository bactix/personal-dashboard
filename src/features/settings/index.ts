import type { WidgetDefinition } from "@/types/widget";

import { WorldClocksListWidget } from "./components/world-clocks-list-widget";
import { WorldClocksWidget } from "./components/world-clocks-widget";

// Public surface of the settings feature. Server-only code lives in ./server
// and is deliberately NOT re-exported here.
export { HeaderClock } from "./components/header-clock";
export { SettingsPage } from "./components/settings-page";
export { useTimezones } from "./hooks";
export type { Timezone } from "./types";

/** All registered clocks as a list (used on the Personal dashboard). */
export const worldClocksListWidget: WidgetDefinition = {
  id: "world-clocks-list",
  title: "World clocks",
  component: WorldClocksListWidget,
  size: { md: 1, xl: 1 },
};

export const worldClocksWidget: WidgetDefinition = {
  id: "world-clocks",
  title: "World clocks",
  component: WorldClocksWidget,
  size: { md: 1, xl: 1 },
};
