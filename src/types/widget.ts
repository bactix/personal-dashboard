import type { ComponentType } from "react";

/** Number of grid columns a widget spans at a given breakpoint. */
export type ColumnSpan = 1 | 2 | 3 | 4;

export type WidgetSize = {
  /** < md (mobile). The grid is a single column here, so this is always full width. */
  base?: 1;
  /** >= md (2-column grid). */
  md?: 1 | 2;
  /** >= xl (4-column grid). */
  xl?: ColumnSpan;
  /** Rows spanned at >= xl, for tall widgets (e.g. a scrolling list). */
  rows?: 1 | 2;
};

/**
 * Describes one dashboard tile. The grid renders purely from a list of these,
 * so adding a feature never requires editing the page or the grid.
 */
export type WidgetDefinition = {
  /** Stable unique id, e.g. "weather". */
  id: string;
  title: string;
  /** Self-fetching widget component (usually a client component). */
  component: ComponentType;
  size?: WidgetSize;
  /** Set false to hide without deleting. Defaults to true. */
  enabled?: boolean;
};
