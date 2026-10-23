import type { WidgetDefinition } from "@/types/widget";

import { TasksStatsWidget } from "./components/tasks-stats-widget";
import { TasksSummaryWidget } from "./components/tasks-summary-widget";

// Public surface of the tasks feature. Server-only code lives in ./server
// and is deliberately NOT re-exported here.
export { TasksPage } from "./components/tasks-page";
export { useTasks } from "./hooks";
export type { Task } from "./types";

export const tasksWidget: WidgetDefinition = {
  id: "tasks",
  title: "Tasks",
  component: TasksSummaryWidget,
  size: { md: 1, xl: 1, rows: 2 },
};

export const tasksStatsWidget: WidgetDefinition = {
  id: "tasks-stats",
  title: "Tasks",
  component: TasksStatsWidget,
  size: { md: 1, xl: 1 },
};
