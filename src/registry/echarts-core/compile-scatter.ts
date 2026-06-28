import type { EChartsOption } from "echarts";
import { applyChartUiToOption } from "./apply-chart-ui";
import { itemFocus } from "./emphasis-presets";
import type { ChartPart, CompileContext, ScatterSeriesPart } from "./parts/types";

function getAxisKey(ctx: CompileContext, axis: "xAxis" | "yAxis", fallback: string) {
  const part = ctx.parts.find((p): p is Extract<ChartPart, { type: typeof axis }> => p.type === axis);
  return part?.dataKey ?? fallback;
}

/** Object-shaped scatter rows set `hasItemOption`; Symbol.js reads blur/focus per item, not series. */
function scatterDataPoint(opts: {
  label: string;
  x: number;
  y: number;
  color: string;
  symbolSize: number;
  glowing: boolean;
}) {
  const focus = itemFocus();
  return {
    name: opts.label,
    value: [opts.x, opts.y] as [number, number],
    symbolSize: opts.symbolSize,
    itemStyle: { color: opts.color },
    blur: focus.blur,
    emphasis: {
      ...focus.emphasis,
      itemStyle: {
        opacity: 1,
        color: opts.color,
        ...(opts.glowing ? { shadowBlur: 14, shadowColor: opts.color } : {}),
      },
    },
  };
}

export function compileScatterOption(ctx: CompileContext): EChartsOption {
  const scatters = ctx.parts.filter((p): p is ScatterSeriesPart => p.type === "scatter");
  const hasGrid = ctx.parts.some((p) => p.type === "grid");
  const xKey = getAxisKey(ctx, "xAxis", "x");
  const yKey = getAxisKey(ctx, "yAxis", "y");

  // One ECharts series for all `<Scatter />` parts. Focus/blur live on each data row
  // because SymbolDraw ignores series-level emphasis when `hasItemOption` is true.
  const data = scatters.flatMap((scatter) => {
    const color = ctx.resolveColor(scatter.dataKey, 0);
    const label = ctx.config[scatter.dataKey]?.label?.toString() ?? scatter.dataKey;
    const points = scatter.points ?? [];
    const glowing = scatter.variant?.includes("glow") ?? false;
    const symbolSize = scatter.variant === "bubble" ? 14 : 8;
    return points.map((p) =>
      scatterDataPoint({
        label,
        x: Number(p[xKey] ?? p.x ?? 0),
        y: Number(p[yKey] ?? p.y ?? 0),
        color,
        symbolSize,
        glowing,
      }),
    );
  });

  const series =
    data.length > 0
      ? [
          {
            type: "scatter" as const,
            data,
            stateAnimation: { duration: 0 },
          },
        ]
      : [];

  const base: EChartsOption = {
    grid: { left: 56, right: 24, top: 24, bottom: 48, containLabel: true },
    tooltip: { trigger: "item" },
    xAxis: { type: "value", splitLine: { show: hasGrid } },
    yAxis: { type: "value", splitLine: { show: hasGrid } },
    series,
  };

  return applyChartUiToOption(ctx, base);
}
