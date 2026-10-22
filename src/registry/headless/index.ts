/**
 * `@nqlib/nqchart/headless` — compile and render a chart with no DOM and no React.
 *
 * The compile path imports no React module; a Node consumer runs it with no DOM.
 * `scripts/check-internals.mjs` fails the build when a React import reaches it.
 *
 * Recipe: register a theme for the chart id, compile inside it, put the print legend
 * in, render to SVG.
 */

// The compilers (pure: context in, ECharts option out).
export { compileAreaOption, buildAreaSeries } from "@/registry/echarts-core/compile-area";
export { compileBarOption } from "@/registry/echarts-core/compile-bar";
export { compileCalendarOption } from "@/registry/echarts-core/compile-calendar";
export { compileComposedOption } from "@/registry/echarts-core/compile-composed";
export { compileFunnelOption } from "@/registry/echarts-core/compile-funnel";
export { compileGaugeOption } from "@/registry/echarts-core/compile-gauge";
export { compileHeatmapOption } from "@/registry/echarts-core/compile-heatmap";
export { compileLineOption } from "@/registry/echarts-core/compile-line";
export { compilePieOption } from "@/registry/echarts-core/compile-pie";
export { compileRadarOption } from "@/registry/echarts-core/compile-radar";
export { compileRadialBarOption, compileRoseBarOption } from "@/registry/echarts-core/compile-radial-bar";
export { compileRadialOption } from "@/registry/echarts-core/compile-radial";
export { compileScatterOption } from "@/registry/echarts-core/compile-scatter";
export { compileSparklineOption } from "@/registry/echarts-core/compile-sparkline";
export { compileTreemapOption } from "@/registry/echarts-core/compile-treemap";
export { compileWaterfallOption } from "@/registry/echarts-core/compile-waterfall";

// Helpers the compile context and the option need.
export { withLegendFocus } from "@/registry/echarts-core/legend-focus";
export { createColorResolver } from "@/registry/echarts-core/resolve-chart-colors";
export {
  CHART_FONT_FAMILY_FALLBACK,
  CHART_TYPOGRAPHY,
} from "@/registry/echarts-core/chart-typography-tokens";

// The theme registry.
export { headlessThemeOf, withHeadlessTheme } from "@/registry/echarts-core/headless-theme";
export type {
  HeadlessChromeColors,
  HeadlessTheme,
  HeadlessToneColors,
} from "@/registry/echarts-core/headless-theme";

// The print legend and the SVG render.
export { printLegend, PRINT_LEGEND_HEIGHT_PX } from "./print-legend";
export { renderToSvg } from "./render-to-svg";
export type { RenderToSvgOptions } from "./render-to-svg";

// Types.
export type { ChartConfig } from "@/registry/ui/chart";
export type {
  AreaSeriesPart,
  BarLayout,
  BarSeriesPart,
  BrushPart,
  CalendarPart,
  CartesianCompileConfig,
  ChartPart,
  CompileContext,
  FunnelCompileConfig,
  FunnelPart,
  FunnelStylePart,
  GaugePart,
  GridPart,
  HeatmapPart,
  LegendPart,
  LineSeriesPart,
  NQScale,
  PieSeriesPart,
  PolarAngleAxisPart,
  PolarGridPart,
  RadarSeriesPart,
  RadialBarPart,
  RadialCompileConfig,
  ReferenceBandPart,
  ReferenceLinePart,
  ScatterSeriesPart,
  SparklinePart,
  StackType,
  TooltipPart,
  TreemapPart,
  TreemapStylePart,
  WaterfallPart,
  WhiskersPart,
  XAxisPart,
  YAxisPart,
} from "@/registry/echarts-core/parts/types";
