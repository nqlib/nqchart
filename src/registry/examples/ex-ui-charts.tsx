"use client";

import {
  NQBarChart,
  Bar,
  Grid,
  Legend,
  Tooltip,
  XAxis,
} from "@/registry/charts/bar-chart";
import {
  NQLineChart,
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
    <NQLineChart
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
    </NQLineChart>
  );
}

function UiBarChartShell({ tooltipVariant }: { tooltipVariant: "default" | "frosted-glass" }) {
  return (
    <NQBarChart
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
    </NQBarChart>
  );
}

// Background examples
export function NQExampleBgDotsLineChart() {
  return <UiLineChartShell backgroundVariant="dots" />;
}
export function NQExampleBgGraphPaperLineChart() {
  return <UiLineChartShell backgroundVariant="graph-paper" />;
}
export function NQExampleBgCrossHatchLineChart() {
  return <UiLineChartShell backgroundVariant="cross-hatch" />;
}
export function NQExampleBgDiagonalLinesLineChart() {
  return <UiLineChartShell backgroundVariant="diagonal-lines" />;
}
export function NQExampleBgPlusLineChart() {
  return <UiLineChartShell backgroundVariant="plus" />;
}
export function NQExampleBgFallingTrianglesLineChart() {
  return <UiLineChartShell backgroundVariant="falling-triangles" />;
}
export function NQExampleBg4PointedStarLineChart() {
  return <UiLineChartShell backgroundVariant="4-pointed-star" />;
}
export function NQExampleBgTinyCheckersLineChart() {
  return <UiLineChartShell backgroundVariant="tiny-checkers" />;
}
export function NQExampleBgOverlappingCirclesLineChart() {
  return <UiLineChartShell backgroundVariant="overlapping-circles" />;
}
export function NQExampleBgWiggleLinesLineChart() {
  return <UiLineChartShell backgroundVariant="wiggle-lines" />;
}
export function NQExampleBgBubblesLineChart() {
  return <UiLineChartShell backgroundVariant="bubbles" />;
}

// Legend examples
export function NQExampleLegendSquareLineChart() {
  return <UiLineChartShell legendVariant="square" />;
}
export function NQExampleLegendCircleLineChart() {
  return <UiLineChartShell legendVariant="circle" />;
}
export function NQExampleLegendCircleOutlineLineChart() {
  return <UiLineChartShell legendVariant="circle-outline" />;
}
export function NQExampleLegendRoundedSquareLineChart() {
  return <UiLineChartShell legendVariant="rounded-square" />;
}
export function NQExampleLegendRoundedSquareOutlineLineChart() {
  return <UiLineChartShell legendVariant="rounded-square-outline" />;
}
export function NQExampleLegendVerticalBarLineChart() {
  return <UiLineChartShell legendVariant="vertical-bar" />;
}
export function NQExampleLegendHorizontalBarLineChart() {
  return <UiLineChartShell legendVariant="horizontal-bar" />;
}

// Tooltip examples
export function NQExampleTooltipDefaultBarChart() {
  return <UiBarChartShell tooltipVariant="default" />;
}
export function NQExampleTooltipFrostedGlassBarChart() {
  return <UiBarChartShell tooltipVariant="frosted-glass" />;
}
