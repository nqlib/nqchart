import type { EChartsOption } from "echarts";
import { applyChartUiToOption } from "./apply-chart-ui";
import { cartesianLineFocus, hoverFocusOrOff, isHoverFocusOn } from "./emphasis-presets";
import {
  applyAxisPartToOption,
  buildValueYAxes,
  resolveYAxisIndex,
} from "./cartesian-axes";
import { resolveCanvasGapColor } from "./resolve-chart-chrome";
import { resolveCartesianGrid } from "./chart-grid";
import { buildCategoryDataZoom, gridBottomWithZoom } from "./category-data-zoom";
import { areaVerticalFill, withAlpha } from "./color-alpha";
import { categoryValues, getXKey, seriesValue, LINE_MARKER, lineStyleType } from "./cartesian-series";
import { resolveAreaFillColor } from "./resolve-chart-colors";
import { normalizeStackPercent } from "./stack-percent";
import type { AreaSeriesPart, CompileContext, XAxisPart, YAxisPart } from "./parts/types";
import { seriesLabelOption } from "./series-labels";

function isGlowing(variant?: string) {
  return variant?.includes("glow");
}

function areaStyleFor(variant: string | undefined, color: string) {
  if (variant === "gradient-reverse") {
    return {
      color: {
        type: "linear" as const,
        x: 0,
        y: 0,
        x2: 0,
        y2: 1,
        colorStops: [
          { offset: 0, color: withAlpha(color, 0) },
          { offset: 0.45, color: withAlpha(color, 0.08) },
          { offset: 1, color: withAlpha(color, 0.28) },
        ],
      },
    };
  }
  if (
    variant === "gradient" ||
    variant === "gradient-area" ||
    variant === undefined ||
    variant === "default"
  ) {
    return { color: areaVerticalFill(color) };
  }
  if (variant === "hatched" || variant === "lines") {
    return { color: withAlpha(color, 0.22) };
  }
  return { color: withAlpha(color, variant === "dotted" ? 0.14 : 0.22) };
}

export function compileAreaOption(ctx: CompileContext): EChartsOption {
  const gapColor = resolveCanvasGapColor(ctx.chartId);
  const xKey = getXKey(ctx);
  const categories = categoryValues(ctx, xKey);
  const areas = ctx.parts.filter((p): p is AreaSeriesPart => p.type === "area");
  const yAxes = ctx.parts.filter((p): p is YAxisPart => p.type === "yAxis");
  const xAxisPart = ctx.parts.find((p): p is XAxisPart => p.type === "xAxis");
  const hasGrid = ctx.parts.some((p) => p.type === "grid");
  const stack =
    ctx.cartesian?.stackType === "stacked" || ctx.cartesian?.stackType === "percent"
      ? "nq-area"
      : undefined;
  const hasBrush = ctx.parts.some((p) => p.type === "brush");
  const areaKeys = areas.map((area) => area.dataKey);
  const rows =
    ctx.cartesian?.stackType === "percent" ? normalizeStackPercent(ctx.data, areaKeys) : ctx.data;

  const series = areas.map((area) => {
    const color = ctx.resolveColor(area.dataKey, 0);
    const fillColor = resolveAreaFillColor(ctx.config, area.dataKey, ctx.resolveColor, 0);
    const glowing = isGlowing(area.variant);
    const areaStyle = areaStyleFor(area.variant, fillColor);
    const lineWidth = area.variant === "solid-stroke" ? 2 : 1.5;
    return {
      type: "line" as const,
      id: area.dataKey,
      name: ctx.config[area.dataKey]?.label?.toString() ?? area.dataKey,
      stack: area.stackId ?? stack,
      yAxisIndex: resolveYAxisIndex(area.yAxisId, yAxes),
      smooth: area.curveType === "monotone" || area.curveType === "bump",
      step: area.curveType === "step" ? ("end" as const) : undefined,
      data: rows.map((row) => seriesValue(row[area.dataKey])),
      areaStyle,
      lineStyle: {
        color,
        type: lineStyleType(area.variant),
        width: lineWidth,
      },
      triggerLineEvent: true,
      label: seriesLabelOption(area.showLabels, area.labelFormatter),
      ...LINE_MARKER,
      itemStyle: { color, borderColor: gapColor, borderWidth: 1.5 },
      ...hoverFocusOrOff(
        isHoverFocusOn(ctx),
        cartesianLineFocus({
          color,
          lineWidth: glowing ? lineWidth + 0.5 : lineWidth,
          borderColor: gapColor,
          borderWidth: 1.5,
          areaStyle,
          shadowBlur: glowing ? 16 : undefined,
        }),
      ),
    };
  });

  const yAxisList = buildValueYAxes({
    yAxes,
    hasGrid,
    percent: ctx.cartesian?.stackType === "percent",
  });
  const xAxis = applyAxisPartToOption(
    { type: "category", data: categories, boundaryGap: false },
    xAxisPart,
    "category",
  );

  const grid = resolveCartesianGrid(ctx.parts, ctx.cartesian?.externalBrush, gridBottomWithZoom(hasBrush));
  if (yAxes.some((y) => y.orientation === "right") && !ctx.cartesian?.externalBrush) {
    grid.right = 56;
  }

  const dataZoom = buildCategoryDataZoom(hasBrush, { chartVariant: "area" });
  const base: EChartsOption = {
    grid,
    tooltip: { trigger: "axis" },
    xAxis: xAxis as EChartsOption["xAxis"],
    yAxis: yAxisList,
    ...(dataZoom ? { dataZoom } : {}),
    series,
  };

  return applyChartUiToOption(ctx, base);
}

/** Build area series for composed charts (shared with compile-composed). */
export function buildAreaSeries(ctx: CompileContext) {
  const gapColor = resolveCanvasGapColor(ctx.chartId);
  const areas = ctx.parts.filter((p): p is AreaSeriesPart => p.type === "area");
  const yAxes = ctx.parts.filter((p): p is YAxisPart => p.type === "yAxis");
  return areas.map((area) => {
    const color = ctx.resolveColor(area.dataKey, 0);
    const fillColor = resolveAreaFillColor(ctx.config, area.dataKey, ctx.resolveColor, 0);
    const areaStyle = areaStyleFor(area.variant, fillColor);
    const lineWidth = area.variant === "solid-stroke" ? 2 : 1.5;
    return {
      type: "line" as const,
      id: area.dataKey,
      name: ctx.config[area.dataKey]?.label?.toString() ?? area.dataKey,
      stack: area.stackId,
      yAxisIndex: resolveYAxisIndex(area.yAxisId, yAxes),
      smooth: area.curveType === "monotone" || area.curveType === "bump",
      step: area.curveType === "step" ? ("end" as const) : undefined,
      data: ctx.data.map((row) => seriesValue(row[area.dataKey])),
      areaStyle,
      lineStyle: { color, width: lineWidth, type: lineStyleType(area.variant) },
      triggerLineEvent: true,
      label: seriesLabelOption(area.showLabels, area.labelFormatter),
      ...LINE_MARKER,
      itemStyle: { color, borderColor: gapColor, borderWidth: 1.5 },
      ...hoverFocusOrOff(
        isHoverFocusOn(ctx),
        cartesianLineFocus({
          color,
          lineWidth,
          borderColor: gapColor,
          borderWidth: 1.5,
          areaStyle,
        }),
      ),
    };
  });
}
