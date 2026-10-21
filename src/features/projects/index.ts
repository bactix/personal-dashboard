import type { WidgetDefinition } from "@/types/widget";

import { ProjectsStatsWidget } from "./components/projects-stats-widget";
import { ProjectsSummaryWidget } from "./components/projects-summary-widget";

// Public surface of the projects feature. Other features may import ONLY from here
// (client-safe) or from "@/features/projects/server" (server code).
export { ProjectsPage } from "./components/projects-page";
export { useProjects } from "./hooks";
export type { Project } from "./types";

export const projectsWidget: WidgetDefinition = {
  id: "projects",
  title: "Projects",
  component: ProjectsSummaryWidget,
  size: { md: 1, xl: 1 },
};

export const projectsStatsWidget: WidgetDefinition = {
  id: "projects-stats",
  title: "Projects",
  component: ProjectsStatsWidget,
  size: { md: 1, xl: 1 },
};
