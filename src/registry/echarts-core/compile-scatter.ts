import type { EChartsOption } from "echarts";
import { applyChartUiToOption } from "./apply-chart-ui";
import { applyAxisPartToOption, isLogScale, isTimeScale } from "./cartesian-axes";
import { timeValue } from "./cartesian-series";
import { gridBottomWithZoom } from "./category-data-zoom";
import { resolveCartesianGrid } from "./chart-grid";
import { focusTiming, itemFocus, isHoverFocusOn } from "./emphasis-presets";
import { NQ_TOOLTIP_VALUE } from "./echarts-tooltip";
import { NQ_DATUM, NQ_SERIES_KEY } from "./nq-mark-event";
import type { CompileContext, ScatterDatum, ScatterSeriesPart, XAxisPart, YAxisPart } from "./parts/types";

/** Object-shaped scatter rows set `hasItemOption`; Symbol.js reads blur/focus per item, not series. */
function scatterDataPoint(opts: {
  label: string;
  seriesKey: string;
  datum: ScatterDatum;
  x: number;
  y: number;
  color: string;
  symbolSize: number;
  glowing: boolean;
  hoverFocus: boolean;
  /** Tooltip text when the raw value is not readable (`[epochMs, y]`). */
  tooltipValue?: string;
}) {
  const base = {
    name: opts.label,
    value: [opts.x, opts.y] as [number, number],
    ...(opts.tooltipValue != null ? { [NQ_TOOLTIP_VALUE]: opts.tooltipValue } : {}),
    symbolSize: opts.symbolSize,
    itemStyle: { color: opts.color },
    [NQ_SERIES_KEY]: opts.seriesKey,
    [NQ_DATUM]: opts.datum,
  };
  if (!opts.hoverFocus) {
    return { ...base, emphasis: { disabled: true as const } };
  }
  const focus = itemFocus();
  return {
    ...base,
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
  const xAxisPart = ctx.parts.find((p): p is XAxisPart => p.type === "xAxis");
  const yAxisPart = ctx.parts.find((p): p is YAxisPart => p.type === "yAxis");
  const xKey = xAxisPart?.dataKey ?? "x";
  const yKey = yAxisPart?.dataKey ?? "y";
  const timeX = isTimeScale(xAxisPart);
  const logX = !timeX && isLogScale(xAxisPart);
  const logY = isLogScale(yAxisPart);

  /** Plot position of one point, or `null` when the scale has no place for it. */
  const position = (p: ScatterDatum): { x: number; y: number; raw: unknown } | null => {
    const rawX: unknown = p[xKey] ?? p.x;
    const x = timeX ? timeValue(rawX) : Number(rawX ?? 0);
    const y = Number(p[yKey] ?? p.y ?? 0);
    if (x == null || !Number.isFinite(x) || !Number.isFinite(y)) return null;
    // A log axis has no place for 0 or a negative value.
    if ((logX && x <= 0) || (logY && y <= 0)) return null;
    return { x, y, raw: rawX };
  };

  // One ECharts series for all `<Scatter />` parts. Focus/blur live on each data row
  // because SymbolDraw ignores series-level emphasis when `hasItemOption` is true.
  // Identity for mark clicks is per-point `__nq_seriesKey` / `__nq_datum` (not seriesName).
  const data = scatters.flatMap((scatter) => {
    const color = ctx.resolveColor(scatter.dataKey, 0);
    const label = ctx.config[scatter.dataKey]?.label?.toString() ?? scatter.dataKey;
    const points = scatter.points ?? [];
    const glowing = scatter.variant?.includes("glow") ?? false;
    const symbolSize = scatter.variant === "bubble" ? 14 : 8;
    return points.flatMap((p) => {
      const at = position(p);
      if (!at) return [];
      return [
        scatterDataPoint({
          label,
          seriesKey: scatter.dataKey,
          datum: p,
          x: at.x,
          y: at.y,
          color,
          symbolSize,
          glowing,
          hoverFocus: isHoverFocusOn(ctx),
          ...(timeX ? { tooltipValue: `${String(at.raw)} · ${at.y.toLocaleString()}` } : {}),
        }),
      ];
    });
  });

  const series =
    data.length > 0
      ? [
          {
            type: "scatter" as const,
            // Stable id so reference filters / cursor patching can identify this series.
            id: scatters.length === 1 ? scatters[0]!.dataKey : "__nq_scatter__",
            name: scatters.length === 1 ? scatters[0]!.dataKey : undefined,
            data,
            // Per-row focus lives on the data objects; the timing is series-level.
            ...focusTiming("scatter"),
          },
        ]
      : [];

  const base: EChartsOption = {
    // Same grid contract as line/bar/area/composed/waterfall — one framing for every
    // cartesian chart. `containLabel` already measures the axis labels, so the outer
    // padding stays tight instead of floating the plot in a wide margin.
    grid: resolveCartesianGrid(ctx.parts, undefined, gridBottomWithZoom(false)),
    tooltip: { trigger: "item" },
    // Same `<Grid />` contract as bar/area/line/composed: horizontal value guides only.
    // Value×value plots used to enable both axes, which read as a graph-paper lattice
    // and looked like a decorative Background on the catalog page.
    xAxis: applyAxisPartToOption({ type: "value", splitLine: { show: false } }, xAxisPart, "value", {
      time: true,
    }) as EChartsOption["xAxis"],
    yAxis: applyAxisPartToOption(
      { type: "value", splitLine: { show: hasGrid } },
      yAxisPart,
      "value",
    ) as EChartsOption["yAxis"],
    series,
  };

  return applyChartUiToOption(ctx, base);
}
