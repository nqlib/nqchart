"use client";

import {
  BeeBarChart,
  Bar,
  Grid,
  Legend,
  Tooltip,
  XAxis,
} from "@/registry/charts/bar-chart";
import {
  BeeLineChart,
  Legend as LineLegend,
  Line,
  Tooltip as LineTooltip,
  XAxis as LineXAxis,
} from "@/registry/charts/line-chart";
import {
  DUAL_SERIES_CHART_CONFIG,
  formatMonthTickShort,
  TRAFFIC_MONTHLY_DATA,
} from "@/registry/examples/example-shared";
import { ChartBackground, type BackgroundVariant } from "@/registry/ui/background";
import type { ChartLegendVariant } from "@/registry/ui/legend";

function UiLineChartShell({
  backgroundVariant,
  legendVariant,
}: {
  backgroundVariant?: BackgroundVariant;
  legendVariant?: ChartLegendVariant;
}) {
  return (
    <BeeLineChart
      data={[...TRAFFIC_MONTHLY_DATA]}
      config={DUAL_SERIES_CHART_CONFIG}
      className="h-full w-full p-4"
      xDataKey="month"
    >
      {backgroundVariant ? <ChartBackground variant={backgroundVariant} /> : null}
      <LineXAxis dataKey="month" tickFormatter={formatMonthTickShort} />
      <LineLegend variant={legendVariant} isClickable />
      <LineTooltip />
      <Line dataKey="desktop" />
      <Line dataKey="mobile" curveType="monotone" />
    </BeeLineChart>
  );
}

function UiBarChartShell({ tooltipVariant }: { tooltipVariant: "default" | "frosted-glass" }) {
  return (
    <BeeBarChart
      data={[...TRAFFIC_MONTHLY_DATA]}
      config={DUAL_SERIES_CHART_CONFIG}
      className="h-full w-full p-4"
      xDataKey="month"
    >
      <Grid />
      <XAxis dataKey="month" tickFormatter={formatMonthTickShort} />
      <Legend />
      <Tooltip variant={tooltipVariant} />
      <Bar dataKey="desktop" />
      <Bar dataKey="mobile" />
    </BeeBarChart>
  );
}

// Background examples
export function BeeExampleBgDotsLineChart() {
  return <UiLineChartShell backgroundVariant="dots" />;
}
export function BeeExampleBgGraphPaperLineChart() {
  return <UiLineChartShell backgroundVariant="graph-paper" />;
}
export function BeeExampleBgCrossHatchLineChart() {
  return <UiLineChartShell backgroundVariant="cross-hatch" />;
}
export function BeeExampleBgDiagonalLinesLineChart() {
  return <UiLineChartShell backgroundVariant="diagonal-lines" />;
}
export function BeeExampleBgPlusLineChart() {
  return <UiLineChartShell backgroundVariant="plus" />;
}
export function BeeExampleBgFallingTrianglesLineChart() {
  return <UiLineChartShell backgroundVariant="falling-triangles" />;
}
export function BeeExampleBg4PointedStarLineChart() {
  return <UiLineChartShell backgroundVariant="4-pointed-star" />;
}
export function BeeExampleBgTinyCheckersLineChart() {
  return <UiLineChartShell backgroundVariant="tiny-checkers" />;
}
export function BeeExampleBgOverlappingCirclesLineChart() {
  return <UiLineChartShell backgroundVariant="overlapping-circles" />;
}
export function BeeExampleBgWiggleLinesLineChart() {
  return <UiLineChartShell backgroundVariant="wiggle-lines" />;
}
export function BeeExampleBgBubblesLineChart() {
  return <UiLineChartShell backgroundVariant="bubbles" />;
}

// Legend examples
export function BeeExampleLegendSquareLineChart() {
  return <UiLineChartShell legendVariant="square" />;
}
export function BeeExampleLegendCircleLineChart() {
  return <UiLineChartShell legendVariant="circle" />;
}
export function BeeExampleLegendCircleOutlineLineChart() {
  return <UiLineChartShell legendVariant="circle-outline" />;
}
export function BeeExampleLegendRoundedSquareLineChart() {
  return <UiLineChartShell legendVariant="rounded-square" />;
}
export function BeeExampleLegendRoundedSquareOutlineLineChart() {
  return <UiLineChartShell legendVariant="rounded-square-outline" />;
}
export function BeeExampleLegendVerticalBarLineChart() {
  return <UiLineChartShell legendVariant="vertical-bar" />;
}
export function BeeExampleLegendHorizontalBarLineChart() {
  return <UiLineChartShell legendVariant="horizontal-bar" />;
}

// Tooltip examples
export function BeeExampleTooltipDefaultBarChart() {
  return <UiBarChartShell tooltipVariant="default" />;
}
export function BeeExampleTooltipFrostedGlassBarChart() {
  return <UiBarChartShell tooltipVariant="frosted-glass" />;
}
