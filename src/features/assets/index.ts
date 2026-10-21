import type { WidgetDefinition } from "@/types/widget";

import { AssetsStatsWidget } from "./components/assets-stats-widget";

// Public surface of the assets feature. Server-only code lives in ./server
// and is deliberately NOT re-exported here.
export { AssetsPage } from "./components/assets-page";

export const assetsStatsWidget: WidgetDefinition = {
  id: "assets-stats",
  title: "Assets",
  component: AssetsStatsWidget,
  size: { md: 1, xl: 1 },
};
