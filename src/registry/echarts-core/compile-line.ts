/**
 * Pure server-safe line compiler — maps parts + data to an ECharts option.
 * Never touches `document`, React hooks, or browser APIs.
 */
import type { EChartsOption } from "echarts";
import { applyChartUiToOption } from "./apply-chart-ui";
import { cartesianLineFocus, hoverFocusOrOff, isHoverFocusOn } from "./emphasis-presets";
import {
  applyAxisPartToOption,
  buildValueYAxes,
  isLogScale,
  isTimeScale,
  resolveYAxisIndex,
  seriesYAxisPart,
} from "./cartesian-axes";
import {
  categoryValues,
  getXKey,
  logSafeValue,
  seriesValue,
  timeSeriesData,
  LINE_MARKER,
  lineStyleType,
} from "./cartesian-series";
import { resolveCartesianGrid, withValueLabelRoom } from "./chart-grid";
import { buildCategoryDataZoom, gridBottomWithZoom } from "./category-data-zoom";
import type { CompileContext, LineSeriesPart, XAxisPart, YAxisPart } from "./parts/types";
import { seriesLabelOption, valueLabelTexts } from "./series-labels";

export function compileLineOption(ctx: CompileContext): EChartsOption {
  const xKey = getXKey(ctx);
  const categories = categoryValues(ctx, xKey);
  const lines = ctx.parts.filter((p): p is LineSeriesPart => p.type === "line");
  const yAxes = ctx.parts.filter((p): p is YAxisPart => p.type === "yAxis");
  const xAxisPart = ctx.parts.find((p): p is XAxisPart => p.type === "xAxis");
  const hasGrid = ctx.parts.some((p) => p.type === "grid");
  const time = isTimeScale(xAxisPart);
  // The brush footer is a category strip; a time axis has no category bands.
  const hasBrush = !time && ctx.parts.some((p) => p.type === "brush");

  const series = lines.map((line) => {
    const color = ctx.resolveColor(line.dataKey, 0);
    const log = isLogScale(seriesYAxisPart(line.yAxisId, yAxes));
    return {
      type: "line" as const,
      id: line.dataKey,
      name: ctx.config[line.dataKey]?.label?.toString() ?? line.dataKey,
      yAxisIndex: resolveYAxisIndex(line.yAxisId, yAxes),
      data: time
        ? timeSeriesData(ctx.data, xKey, line.dataKey, log)
        : ctx.data.map((row) => logSafeValue(seriesValue(row[line.dataKey]), log)),
      smooth: line.curveType === "monotone",
      step: line.curveType === "step" ? ("end" as const) : undefined,
      itemStyle: { color },
      lineStyle: { color, type: lineStyleType(line.variant) },
      triggerLineEvent: true,
      label: seriesLabelOption(line.showLabels, line.labelFormatter, ctx.chartId),
      ...LINE_MARKER,
      ...hoverFocusOrOff(isHoverFocusOn(ctx), cartesianLineFocus({ color })),
    };
  });

  const yAxisList = buildValueYAxes({ yAxes, hasGrid });
  const xAxis = applyAxisPartToOption(
    { type: "category", data: categories },
    xAxisPart,
    "category",
    { time: true },
  );

  const grid = withValueLabelRoom(
    resolveCartesianGrid(ctx.parts, !time && ctx.cartesian?.externalBrush, gridBottomWithZoom(hasBrush)),
    valueLabelTexts(lines, ctx.data as Record<string, unknown>[]),
  );

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
