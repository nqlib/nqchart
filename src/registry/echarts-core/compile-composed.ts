import type { EChartsOption } from "echarts";
import { applyChartUiToOption } from "./apply-chart-ui";
import { cartesianColumnFocus, cartesianLineFocus } from "./emphasis-presets";
import { resolveCanvasGapColor } from "./resolve-chart-chrome";
import { barBorderRadius, resolveBarRadius } from "./bar-radius";
import { categoryValues, getXKey, LINE_MARKER } from "./cartesian-series";
import { resolveCartesianGrid } from "./chart-grid";
import { buildCategoryDataZoom, gridBottomWithZoom } from "./category-data-zoom";
import type {
  BarSeriesPart,
  CompileContext,
  LineSeriesPart,
  WhiskersPart,
  YAxisPart,
} from "./parts/types";

export function compileComposedOption(ctx: CompileContext): EChartsOption {
  const gapColor = resolveCanvasGapColor(ctx.chartId);
  const xKey = getXKey(ctx);
  const categories = categoryValues(ctx, xKey);
  const bars = ctx.parts.filter((p): p is BarSeriesPart => p.type === "bar");
  const lines = ctx.parts.filter((p): p is LineSeriesPart => p.type === "line");
  const whiskers = ctx.parts.filter((p): p is WhiskersPart => p.type === "whiskers");
  const yAxes = ctx.parts.filter((p): p is YAxisPart => p.type === "yAxis");
  const hasGrid = ctx.parts.some((p) => p.type === "grid");
  const hasBrush = ctx.parts.some((p) => p.type === "brush");

  const yAxisList = yAxes.length
    ? yAxes.map((ya, i) => ({
        type: "value" as const,
        name: ya.unit ?? "",
        position: (ya.orientation === "right" ? "right" : "left") as "left" | "right",
        min: ya.domain?.[0],
        max: ya.domain?.[1],
        splitLine: { show: i === 0 && hasGrid },
      }))
    : [{ type: "value" as const, splitLine: { show: hasGrid } }];

  // A series may ask for the right axis; only honor it when a second axis exists,
  // otherwise yAxisIndex would point at a missing axis and ECharts renders nowhere.
  const rightAxisIndex = yAxisList.length > 1 ? 1 : 0;
  const yAxisIndexFor = (yAxisId?: string) => (yAxisId === "right" ? rightAxisIndex : 0);

  const barSeries = bars.map((bar) => {
    const r = resolveBarRadius(bar.radius, ctx.cartesian?.barRadius);
    const color = ctx.resolveColor(bar.dataKey, 0);
    return {
      type: "bar" as const,
      name: ctx.config[bar.dataKey]?.label?.toString() ?? bar.dataKey,
      yAxisIndex: yAxisIndexFor(bar.yAxisId),
      stack: bar.stackId,
      data: ctx.data.map((row) => Number(row[bar.dataKey] ?? 0)),
      itemStyle: {
        color,
        borderRadius: barBorderRadius(r, false),
      },
      ...cartesianColumnFocus(color),
    };
  });

  const lineSeries = lines.map((line) => {
    const color = ctx.resolveColor(line.dataKey, 0);
    const markersOnly = line.variant === "points";
    return {
      type: "line" as const,
      name: ctx.config[line.dataKey]?.label?.toString() ?? line.dataKey,
      yAxisIndex: yAxisIndexFor(line.yAxisId),
      data: ctx.data.map((row) => Number(row[line.dataKey] ?? 0)),
      smooth: !markersOnly && line.curveType === "monotone",
      showLine: !markersOnly,
      triggerLineEvent: true,
      itemStyle: { color },
      lineStyle: { color, width: markersOnly ? 0 : 2 },
      showSymbol: true,
      symbol: markersOnly ? "rect" : LINE_MARKER.symbol,
      symbolSize: markersOnly ? [16, 3] : LINE_MARKER.symbolSize,
      ...cartesianLineFocus({
        color,
        lineWidth: markersOnly ? 0 : 3,
        borderColor: gapColor,
        borderWidth: markersOnly ? 0 : 2,
      }),
    };
  });

  const whiskerSeries = whiskers.map((w) => {
    const dataKey = w.dataKey ?? "whiskers";
    const color = ctx.resolveColor(dataKey, 0);
    return {
      type: "custom" as const,
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

  const grid = resolveCartesianGrid(ctx.parts, ctx.cartesian?.externalBrush, gridBottomWithZoom(hasBrush));
  if (yAxes.some((y) => y.orientation === "right") && !ctx.cartesian?.externalBrush) {
    grid.right = 56;
  }

  const base: EChartsOption = {
    grid,
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" },
    },
    xAxis: { type: "category", data: categories },
    yAxis: yAxisList,
    dataZoom: buildCategoryDataZoom(hasBrush, { chartVariant: "composed" }),
    series: [...barSeries, ...lineSeries, ...whiskerSeries] as EChartsOption["series"],
  };

  return applyChartUiToOption(ctx, base);
}
