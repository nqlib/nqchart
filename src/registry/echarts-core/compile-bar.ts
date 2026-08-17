/**
 * Pure server-safe bar compiler — maps parts + data to an ECharts option.
 * Never touches `document`, React hooks, or browser APIs.
 */
import type { BarSeriesOption, EChartsOption } from "echarts";
import { applyChartUiToOption } from "./apply-chart-ui";
import { cartesianColumnFocus, hoverFocusOrOff, isHoverFocusOn } from "./emphasis-presets";
import { barVariantFill } from "./bar-pattern";
import { resolveAreaFillColor } from "./resolve-chart-colors";
import {
  barItemBorderRadius,
  buildStackCornerRoles,
  resolveBarRadius,
  stackSegmentGapStyle,
  type StackCornerRole,
} from "./bar-radius";
import { resolveCartesianGrid } from "./chart-grid";
import { buildCategoryDataZoom, gridBottomWithZoom } from "./category-data-zoom";
import { buildMonospaceCustomSeries } from "./compile-monospace-bar";
import {
  hoverTraceSeriesId,
} from "./hover-trace-bar";
import { categoryValues, getXKey, seriesValue } from "./cartesian-series";
import { normalizeStackPercent } from "./stack-percent";
import type { BarSeriesPart, CompileContext, XAxisPart, YAxisPart } from "./parts/types";
import {
  applyAxisPartToOption,
  buildValueYAxes,
  resolveYAxisIndex,
} from "./cartesian-axes";
import { seriesLabelOption } from "./series-labels";

type BarPointItemStyle = {
  color: unknown;
  borderRadius: [number, number, number, number];
  borderWidth?: number | [number, number, number, number];
  borderColor?: string;
};

function groupStackRoles(
  bars: BarSeriesPart[],
  rows: Record<string, unknown>[],
  defaultStack: string | undefined,
): Map<string, StackCornerRole[]> {
  const rolesByKey = new Map<string, StackCornerRole[]>();
  const groups = new Map<string, BarSeriesPart[]>();

  for (const bar of bars) {
    const stackId = bar.stackId ?? defaultStack;
    if (!stackId) continue;
    const group = groups.get(stackId) ?? [];
    group.push(bar);
    groups.set(stackId, group);
  }

  for (const groupBars of groups.values()) {
    const groupRoles = buildStackCornerRoles(groupBars, rows);
    for (const [dataKey, roles] of groupRoles) {
      rolesByKey.set(dataKey, roles);
    }
  }

  return rolesByKey;
}

function buildBarDataPoints(
  bar: BarSeriesPart,
  ctx: CompileContext,
  rows: Record<string, unknown>[],
  stack: string | undefined,
  horizontal: boolean,
  stackRoles: Map<string, StackCornerRole[]>,
  isHistogram: boolean,
) {
  const r = isHistogram
    ? (bar.radius != null ? bar.radius : 0)
    : resolveBarRadius(bar.radius, ctx.cartesian?.barRadius, ctx.chartId);
  const strokeColor = ctx.resolveColor(bar.dataKey, 0);
  const fillColor = resolveAreaFillColor(ctx.config, bar.dataKey, ctx.resolveColor, 0);
  const color = barVariantFill(bar.variant, strokeColor, horizontal, fillColor);
  const effectiveStack = bar.stackId ?? stack;
  const roles = effectiveStack ? stackRoles.get(bar.dataKey) : undefined;

  return rows.map((row, dataIndex) => {
    const value = seriesValue(row[bar.dataKey]);
    const role = roles?.[dataIndex];
    const borderRadius = barItemBorderRadius(bar.variant, role, r, horizontal);
    const gapStyle = role != null ? stackSegmentGapStyle(role, horizontal) : {};

    return {
      value,
      itemStyle: {
        color,
        borderRadius,
        ...gapStyle,
      } as BarPointItemStyle,
    };
  });
}

export function compileBarOption(ctx: CompileContext): EChartsOption {
  const xKey = getXKey(ctx);
  const categories = categoryValues(ctx, xKey);
  const bars = ctx.parts.filter((p): p is BarSeriesPart => p.type === "bar");
  const yAxes = ctx.parts.filter((p): p is YAxisPart => p.type === "yAxis");
  const xAxisPart = ctx.parts.find((p): p is XAxisPart => p.type === "xAxis");
  const hasGrid = ctx.parts.some((p) => p.type === "grid");
  const hasBrush = ctx.parts.some((p) => p.type === "brush");
  const horizontal = ctx.cartesian?.layout === "horizontal";
  const stack =
    ctx.cartesian?.stackType === "stacked" || ctx.cartesian?.stackType === "percent"
      ? "nq-stack"
      : undefined;
  const barKeys = bars.map((bar) => bar.dataKey);
  const rows =
    ctx.cartesian?.stackType === "percent" ? normalizeStackPercent(ctx.data, barKeys) : ctx.data;

  const hasMonospace = bars.some((bar) => bar.variant === "monospace");
  const hasHoverTrace = bars.some((bar) => bar.variant === "hover-trace");
  const isHistogram = ctx.cartesian?.variant === "histogram";

  // Match radial: try every tick, then let ECharts drop collisions by view size.
  const categoryAxis = applyAxisPartToOption(
    {
      type: "category" as const,
      data: categories,
      axisLine: { show: true },
      axisTick: { show: false },
      axisLabel: {
        interval: 0,
        hideOverlap: true,
        ...(isHistogram
          ? {
              width: 56,
              overflow: "truncate" as const,
            }
          : {}),
      },
    },
    xAxisPart,
    "category",
  );
  const valueAxes = buildValueYAxes({
    yAxes,
    hasGrid,
    percent: ctx.cartesian?.stackType === "percent",
  });
  const valueAxis = valueAxes[0] ?? {
    type: "value" as const,
    axisLine: { show: false },
    splitLine: { show: hasGrid },
  };
  const stackRoles = groupStackRoles(bars, rows, stack);
  const histogramLayout = isHistogram
    ? { barCategoryGap: 0, barGap: 0, barWidth: "100%" as const }
    : {};
  const stackedLayout = stack
    ? { barGap: 0, barCategoryGap: "20%" as const, barWidth: "55%" as const }
    : {};

  const series = bars.map((bar) => {
    if (bar.variant === "monospace") {
      return buildMonospaceCustomSeries(bar, ctx, rows);
    }

    const color = ctx.resolveColor(bar.dataKey, 0);
    const columnFocus = hoverFocusOrOff(isHoverFocusOn(ctx), cartesianColumnFocus(color));

    if (bar.variant === "hover-trace") {
      return {
        type: "bar" as const,
        id: hoverTraceSeriesId(bar.dataKey),
        name: ctx.config[bar.dataKey]?.label?.toString() ?? bar.dataKey,
        triggerEvent: true,
        yAxisIndex: resolveYAxisIndex(bar.yAxisId, yAxes),
        data: buildBarDataPoints(bar, ctx, rows, stack, horizontal, stackRoles, isHistogram) as BarSeriesOption["data"],
        stack: bar.stackId ?? stack,
        label: seriesLabelOption(bar.showLabels, bar.labelFormatter),
        ...columnFocus,
        ...histogramLayout,
        ...stackedLayout,
      };
    }

    return {
      type: "bar" as const,
      id: bar.dataKey,
      name: ctx.config[bar.dataKey]?.label?.toString() ?? bar.dataKey,
      yAxisIndex: resolveYAxisIndex(bar.yAxisId, yAxes),
      data: buildBarDataPoints(bar, ctx, rows, stack, horizontal, stackRoles, isHistogram) as BarSeriesOption["data"],
      stack: bar.stackId ?? stack,
      label: seriesLabelOption(bar.showLabels, bar.labelFormatter),
      ...columnFocus,
      ...histogramLayout,
      ...stackedLayout,
    };
  });

  const grid = {
    ...resolveCartesianGrid(
      ctx.parts,
      ctx.cartesian?.externalBrush,
      horizontal ? (hasMonospace ? 32 : 4) : gridBottomWithZoom(hasBrush, hasMonospace ? 32 : 4),
      horizontal,
    ),
    ...(hasHoverTrace && !horizontal ? { left: 56 } : {}),
  };
  if (yAxes.some((y) => y.orientation === "right") && !ctx.cartesian?.externalBrush && !horizontal) {
    grid.right = 56;
  }

  const dataZoom = buildCategoryDataZoom(hasBrush, {
    axisDim: horizontal ? "y" : "x",
    chartVariant: "bar",
  });
  const base: EChartsOption = {
    grid,
    tooltip: { trigger: hasMonospace || hasHoverTrace ? "item" : "axis" },
    xAxis: (horizontal ? valueAxis : categoryAxis) as EChartsOption["xAxis"],
    yAxis: (horizontal
      ? categoryAxis
      : yAxes.length > 1
        ? valueAxes
        : valueAxis) as EChartsOption["yAxis"],
    ...(dataZoom ? { dataZoom } : {}),
    series,
  };

  return applyChartUiToOption(ctx, base);
}
