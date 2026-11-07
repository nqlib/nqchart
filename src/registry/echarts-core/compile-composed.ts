import type { EChartsOption } from "echarts";
import { applyChartUiToOption } from "./apply-chart-ui";
import { cartesianColumnFocus, cartesianLineFocus, hoverFocusOrOff, isHoverFocusOn } from "./emphasis-presets";
import { resolveCanvasGapColor } from "./resolve-chart-chrome";
import { barLayoutGaps } from "./bar-item-style";
import {
  barItemBorderRadius,
  groupStackRoles,
  resolveBarRadius,
  resolveStackSeam,
  stackSegmentGapStyle,
} from "./bar-radius";
import {
  applyAxisPartToOption,
  buildValueYAxes,
  resolveYAxisIndex,
} from "./cartesian-axes";
import { categoryValues, getXKey, seriesValue, LINE_MARKER, lineStyleType } from "./cartesian-series";
import { resolveCartesianGrid } from "./chart-grid";
import { resolveChartSignature } from "./chart-signature";
import { buildCategoryDataZoom, gridBottomWithZoom } from "./category-data-zoom";
import { buildAreaSeries } from "./compile-area";
import type {
  BarSeriesPart,
  CompileContext,
  ConnectorPart,
  LineSeriesPart,
  WhiskersPart,
  XAxisPart,
  YAxisPart,
} from "./parts/types";
import { uniquifySeriesIds } from "./series-identity";
import { barLabelPosition, seriesLabelOption } from "./series-labels";

export function compileComposedOption(ctx: CompileContext): EChartsOption {
  const gapColor = resolveCanvasGapColor(ctx.chartId);
  const xKey = getXKey(ctx);
  const categories = categoryValues(ctx, xKey);
  const bars = ctx.parts.filter((p): p is BarSeriesPart => p.type === "bar");
  const lines = ctx.parts.filter((p): p is LineSeriesPart => p.type === "line");
  const whiskers = ctx.parts.filter((p): p is WhiskersPart => p.type === "whiskers");
  const connectors = ctx.parts.filter((p): p is ConnectorPart => p.type === "connector");
  const yAxes = ctx.parts.filter((p): p is YAxisPart => p.type === "yAxis");
  const xAxisPart = ctx.parts.find((p): p is XAxisPart => p.type === "xAxis");
  const hasGrid = ctx.parts.some((p) => p.type === "grid");
  const hasBrush = ctx.parts.some((p) => p.type === "brush");

  const yAxisList = buildValueYAxes({ yAxes, hasGrid });
  const stackRoles = groupStackRoles(bars, ctx.data);

  // Composed charts are always category-x / value-y: bars are vertical.
  const horizontal = false;
  const { seam } = resolveStackSeam(ctx.chartId);
  const gaps = barLayoutGaps(ctx.chartId);

  const barSeries = bars.map((bar) => {
    const r = resolveBarRadius(bar.radius, ctx.cartesian?.barRadius, ctx.chartId);
    // Stack seams are flat: one rounded outer end per stack (see barItemBorderRadius).
    const join = 0;
    const color = ctx.resolveColor(bar.dataKey, 0);
    const roles = bar.stackId ? stackRoles.get(bar.dataKey) : undefined;
    return {
      type: "bar" as const,
      id: bar.dataKey,
      name: ctx.config[bar.dataKey]?.label?.toString() ?? bar.dataKey,
      yAxisIndex: resolveYAxisIndex(bar.yAxisId, yAxes),
      stack: bar.stackId,
      data: ctx.data.map((row, dataIndex) => {
        const value = seriesValue(row[bar.dataKey]);
        const role = roles?.[dataIndex];
        return {
          value,
          itemStyle: {
            borderRadius: barItemBorderRadius(bar.variant, role, r, horizontal, value, join),
            ...(role != null ? stackSegmentGapStyle(role, seam, gapColor, horizontal, value) : {}),
          },
          // Value labels sit at the bar's outer end, which flips for negatives.
          ...(bar.showLabels ? { label: { position: barLabelPosition(value, horizontal) } } : {}),
        };
      }),
      itemStyle: {
        color,
      },
      ...gaps,
      label: seriesLabelOption(bar.showLabels, bar.labelFormatter, ctx.chartId),
      ...hoverFocusOrOff(isHoverFocusOn(ctx), cartesianColumnFocus(color, "composed")),
    };
  });

  const lineSeries = lines.map((line) => {
    const color = ctx.resolveColor(line.dataKey, 0);
    const dots = line.variant === "dots";
    const markersOnly = line.variant === "points" || dots;
    return {
      type: "line" as const,
      id: line.dataKey,
      name: ctx.config[line.dataKey]?.label?.toString() ?? line.dataKey,
      yAxisIndex: resolveYAxisIndex(line.yAxisId, yAxes),
      data: ctx.data.map((row) => seriesValue(row[line.dataKey])),
      smooth: !markersOnly && line.curveType === "monotone",
      showLine: !markersOnly,
      triggerLineEvent: true,
      itemStyle: { color },
      lineStyle: { color, width: markersOnly ? 0 : 2, type: lineStyleType(line.variant) },
      showSymbol: true,
      symbol: dots ? "circle" : markersOnly ? "rect" : LINE_MARKER.symbol,
      symbolSize: dots
        ? resolveChartSignature(ctx.chartId).symbol.point
        : markersOnly
          ? [16, 3]
          : LINE_MARKER.symbolSize,
      label: seriesLabelOption(line.showLabels, line.labelFormatter, ctx.chartId),
      ...hoverFocusOrOff(
        isHoverFocusOn(ctx),
        cartesianLineFocus({
          color,
          lineWidth: markersOnly ? 0 : 3,
          borderColor: gapColor,
          borderWidth: markersOnly ? 0 : 2,
          family: "composed",
        }),
      ),
    };
  });

  const areaSeries = buildAreaSeries(ctx);

  const whiskerSeries = whiskers.map((w) => {
    const dataKey = w.dataKey ?? "whiskers";
    const color = ctx.resolveColor(dataKey, 0);
    return {
      type: "custom" as const,
      id: dataKey,
      name: ctx.config[dataKey]?.label?.toString() ?? "Whiskers",
      clip: true,
      encode: { x: 0, y: [1, 2, 3, 4] },
      data: ctx.data.map((row, index) => [
        index,
        Number(row[w.minKey] ?? 0),
        Number(row[w.q1Key] ?? 0),
        Number(row[w.q3Key] ?? 0),
        Number(row[w.maxKey] ?? 0),
      ]),
      renderItem: (params: unknown, api: unknown) => {
        const a = api as {
          value: (dim: number) => unknown;
          coord: (point: [number, number]) => number[];
          style: (opt: Record<string, unknown>) => Record<string, unknown>;
        };
        const cat = Number(a.value(0));
        const min = Number(a.value(1));
        const q1 = Number(a.value(2));
        const q3 = Number(a.value(3));
        const max = Number(a.value(4));
        const x = a.coord([cat, min])[0]!;
        const yMin = a.coord([cat, min])[1]!;
        const yQ1 = a.coord([cat, q1])[1]!;
        const yQ3 = a.coord([cat, q3])[1]!;
        const yMax = a.coord([cat, max])[1]!;
        const halfCap = 7;
        const style = a.style({
          stroke: color,
          fill: color,
          lineWidth: 1.5,
          lineCap: "round",
        });
        void params;
        return {
          type: "group",
          silent: true,
          children: [
            { type: "line", shape: { x1: x, y1: yMin, x2: x, y2: yQ1 }, style },
            {
              type: "line",
              shape: { x1: x - halfCap, y1: yMin, x2: x + halfCap, y2: yMin },
              style,
            },
            { type: "line", shape: { x1: x, y1: yQ3, x2: x, y2: yMax }, style },
            {
              type: "line",
              shape: { x1: x - halfCap, y1: yMax, x2: x + halfCap, y2: yMax },
              style,
            },
          ],
        };
      },
      z: 5,
      tooltip: { show: false },
    };
  });

  const connectorSeries = connectors.map((c) => {
    const color = ctx.resolveColor(c.dataKey, 0);
    return {
      type: "custom" as const,
      id: c.dataKey,
      name: ctx.config[c.dataKey]?.label?.toString() ?? "Connector",
      clip: true,
      encode: { x: 0, y: [1, 2] },
      data: ctx.data.map((row, index) => [
        index,
        seriesValue(row[c.fromKey]),
        seriesValue(row[c.toKey]),
      ]),
      renderItem: (_params: unknown, api: unknown) => {
        const a = api as {
          value: (dim: number) => unknown;
          coord: (point: [number, number]) => number[];
        };
        const from = a.value(1);
        const to = a.value(2);
        if (from == null || to == null) return { type: "group", children: [] };
        const cat = Number(a.value(0));
        const p1 = a.coord([cat, Number(from)]);
        const p2 = a.coord([cat, Number(to)]);
        return {
          type: "line",
          silent: true,
          shape: { x1: p1[0]!, y1: p1[1]!, x2: p2[0]!, y2: p2[1]! },
          style: { stroke: color, fill: "none", lineWidth: 2, lineCap: "round" },
        };
      },
      z: 1,
      tooltip: { show: false },
    };
  });

  const grid = resolveCartesianGrid(ctx.parts, ctx.cartesian?.externalBrush, gridBottomWithZoom(hasBrush));

  const xAxis = applyAxisPartToOption(
    { type: "category", data: categories },
    xAxisPart,
    "category",
  );

  const dataZoom = buildCategoryDataZoom(hasBrush, { chartVariant: "composed" });
  const base: EChartsOption = {
    grid,
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" },
    },
    xAxis: xAxis as EChartsOption["xAxis"],
    yAxis: yAxisList,
    ...(dataZoom ? { dataZoom } : {}),
    series: uniquifySeriesIds([
      ...barSeries,
      ...lineSeries,
      ...areaSeries,
      ...whiskerSeries,
      ...connectorSeries,
    ]) as EChartsOption["series"],
  };

  return applyChartUiToOption(ctx, base);
}
