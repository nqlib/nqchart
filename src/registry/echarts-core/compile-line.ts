/**
 * Pure server-safe line compiler — maps parts + data to an ECharts option.
 * Never touches `document`, React hooks, or browser APIs.
 */
import type { EChartsOption } from "echarts";
import { applyChartUiToOption } from "./apply-chart-ui";
import { cartesianLineFocus } from "./emphasis-presets";
import {
  applyAxisPartToOption,
  buildValueYAxes,
  resolveYAxisIndex,
} from "./cartesian-axes";
import { categoryValues, getXKey, seriesValue, LINE_MARKER, lineStyleType } from "./cartesian-series";
import { resolveCartesianGrid } from "./chart-grid";
import { buildCategoryDataZoom, gridBottomWithZoom } from "./category-data-zoom";
import type { CompileContext, LineSeriesPart, XAxisPart, YAxisPart } from "./parts/types";
import { seriesLabelOption } from "./series-labels";

export function compileLineOption(ctx: CompileContext): EChartsOption {
  const xKey = getXKey(ctx);
  const categories = categoryValues(ctx, xKey);
  const lines = ctx.parts.filter((p): p is LineSeriesPart => p.type === "line");
  const yAxes = ctx.parts.filter((p): p is YAxisPart => p.type === "yAxis");
  const xAxisPart = ctx.parts.find((p): p is XAxisPart => p.type === "xAxis");
  const hasGrid = ctx.parts.some((p) => p.type === "grid");
  const hasBrush = ctx.parts.some((p) => p.type === "brush");

  const series = lines.map((line) => {
    const color = ctx.resolveColor(line.dataKey, 0);
    return {
      type: "line" as const,
      id: line.dataKey,
      name: ctx.config[line.dataKey]?.label?.toString() ?? line.dataKey,
      yAxisIndex: resolveYAxisIndex(line.yAxisId, yAxes),
      data: ctx.data.map((row) => seriesValue(row[line.dataKey])),
      smooth: line.curveType === "monotone",
      step: line.curveType === "step" ? ("end" as const) : undefined,
      itemStyle: { color },
      lineStyle: { color, type: lineStyleType(line.variant) },
      triggerLineEvent: true,
      label: seriesLabelOption(line.showLabels, line.labelFormatter),
      ...LINE_MARKER,
      ...cartesianLineFocus({ color }),
    };
  });

  const yAxisList = buildValueYAxes({ yAxes, hasGrid });
  const xAxis = applyAxisPartToOption(
    { type: "category", data: categories },
    xAxisPart,
    "category",
  );

  const grid = resolveCartesianGrid(ctx.parts, ctx.cartesian?.externalBrush, gridBottomWithZoom(hasBrush));
  if (yAxes.some((y) => y.orientation === "right") && !ctx.cartesian?.externalBrush) {
    grid.right = 56;
  }

  const dataZoom = buildCategoryDataZoom(hasBrush, { chartVariant: "line" });
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
