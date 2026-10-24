import type { WidgetDefinition } from "@/types/widget";

import { MetalsWidget } from "./components/metals-widget";

// Public surface of the metals feature. Server-only code lives in ./server
// and is deliberately NOT re-exported here.
export const metalsWidget: WidgetDefinition = {
  id: "metals",
  title: "Gold, silver & Bitcoin",
  component: MetalsWidget,
  size: { md: 1, xl: 1 },
};
