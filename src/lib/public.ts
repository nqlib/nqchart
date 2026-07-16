// =============================================================================
// @nqlib/nqchart — root public API
// -----------------------------------------------------------------------------
// Shared chart context, config types, and reusable ui primitives. Each chart
// FAMILY (bar, area, line, …) is published as its own subpath because every
// family defines its own scoped sub-parts (Bar, XAxis, Tooltip, …) that would
// otherwise collide:
//
//   import { NQBarChart, Bar, XAxis } from "@nqlib/nqchart/bar-chart"
//   import { NQAreaChart, Area }      from "@nqlib/nqchart/area-chart"
//   import { ChartConfig, useChart }  from "@nqlib/nqchart"
// =============================================================================

// -----------------------------------------------------------------------------
// Chart context, config, helpers
// -----------------------------------------------------------------------------
export {
  useChart,
  getLoadingData,
  getPayloadConfigFromPayload,
  ChartContainer,
  ChartStyle,
  getColorsCount,
  type ChartConfig,
} from "@/registry/ui/chart";

// -----------------------------------------------------------------------------
// Reusable ui primitives (shared across chart families, no name collisions)
// -----------------------------------------------------------------------------
export {
  ChartBackground,
  NQ_CHART_BACKGROUND_MARKER,
  type BackgroundVariant,
} from "@/registry/ui/background";

export {
  ChartLegend,
  ChartLegendContent,
  NQChartLegend,
  bindChartLegendLayer,
  CHART_LEGEND_LAYER_NAME,
  NQ_CHART_LEGEND_MARKER,
  type ChartLegendVariant,
} from "@/registry/ui/legend";

export {
  ChartTooltip,
  ChartTooltipContent,
  type TooltipVariant,
  type TooltipRoundness,
} from "@/registry/ui/tooltip";

export { type DotVariant } from "@/registry/ui/dot";

export { NQBrush, useNQBrush } from "@/registry/ui/nq-brush";

export {
  ChartLoadingSkeleton,
  type ChartLoadingVariant,
} from "@/registry/ui/chart-loading-skeleton";

export {
  LoadingShimmerPattern,
  useLoadingMaskId,
  generateEasedGradientStops,
} from "@/registry/ui/loading-shimmer";
