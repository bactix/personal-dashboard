import type { WidgetDefinition } from "@/types/widget";

import { WorldClocksWidget } from "./components/world-clocks-widget";

// Public surface of the settings feature. Server-only code lives in ./server
// and is deliberately NOT re-exported here.
export { HeaderClock } from "./components/header-clock";
export { SettingsPage } from "./components/settings-page";
export { useTimezones } from "./hooks";
export type { Timezone } from "./types";

export const worldClocksWidget: WidgetDefinition = {
  id: "world-clocks",
  title: "World clocks",
  component: WorldClocksWidget,
  size: { md: 1, xl: 1 },
};
