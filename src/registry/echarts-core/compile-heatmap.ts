import type { EChartsOption } from "echarts";
import { applyChartUiToOption } from "./apply-chart-ui";
import { itemFocus, hoverFocusOrOff, isHoverFocusOn } from "./emphasis-presets";
import { buildHeatmapDataZoom } from "./category-data-zoom";
import { resolveChartSignature } from "./chart-signature";
import { resolveCanvasGapColor } from "./resolve-chart-chrome";
import type { CompileContext, HeatmapPart } from "./parts/types";
import type { HeatmapCell } from "@/registry/lib/chart-recipes";
import { escapeHtml } from "./echarts-tooltip";

/** Zoom sliders appear only above this many rows or columns (unless set). */
export const HEATMAP_ZOOM_MIN = 12;

export function compileHeatmapOption(ctx: CompileContext): EChartsOption {
  const heatmaps = ctx.parts.filter((p): p is HeatmapPart => p.type === "heatmap");
  const part = heatmaps[0];
  const cells = (part?.cells ?? (ctx.data as unknown as HeatmapCell[])) as HeatmapCell[];
  if (!cells.length) {
    return { series: [] };
  }
  const xLabels = part?.xLabels ?? [...new Set(cells.map((c) => c.col))].sort();
  const yLabels = part?.yLabels ?? [...new Set(cells.map((c) => c.row))].sort();
  const min = part?.min ?? Math.min(...cells.map((c) => c.value));
  const max = part?.max ?? Math.max(...cells.map((c) => c.value));

  const data = cells.map((c) => [
    xLabels.indexOf(c.col),
    yLabels.indexOf(c.row),
    c.value,
  ]);

  // Zoom earns its two sliders only on a matrix too big to read at once; a
  // 6×6 correlation grid with pan handles is all chrome.
  const enableZoom =
    part?.enableZoom ?? (xLabels.length > HEATMAP_ZOOM_MIN || yLabels.length > HEATMAP_ZOOM_MIN);
  // Every column is labelled (an auto interval silently drops some); long
  // names tilt instead of colliding.
  const longest = Math.max(0, ...xLabels.map((l) => String(l).length));
  const tiltX = xLabels.length > 4 && longest > 5;
  const valueSpan = Math.abs(max - min);
  const precision = valueSpan === 0 ? 0 : valueSpan <= 1 ? 2 : valueSpan <= 10 ? 1 : 0;
  const seriesLabel = String(ctx.config[part?.dataKey ?? "intensity"]?.label ?? "Value");
  const colorKey = part?.dataKey ?? "intensity";
  const themeColors =
    ctx.config[colorKey]?.colors?.light ?? ctx.config[colorKey]?.colors?.dark ?? [];
  const colorStops = Math.min(Math.max(themeColors.length, 3), 4);

  const { radius, gap } = resolveChartSignature(ctx.chartId);

  const base: EChartsOption = {
    tooltip: {
      position: "top",
      // A cell is a row × column pair; the default names only the column.
      formatter: (raw: unknown) => {
        const p = raw as { value?: unknown };
        const v = Array.isArray(p.value) ? p.value : [];
        const col = xLabels[Number(v[0])] ?? "";
        const row = yLabels[Number(v[1])] ?? "";
        const value = Number(v[2]);
        const shown = Number.isFinite(value) ? value.toFixed(precision) : "";
        return `<div style="font-weight:500;margin-bottom:4px">${escapeHtml(row)} × ${escapeHtml(col)}</div>` +
          `<div style="display:flex;justify-content:space-between;gap:16px"><span style="opacity:.7">${escapeHtml(seriesLabel)}</span>` +
          `<span style="font-variant-numeric:tabular-nums;font-weight:500">${escapeHtml(shown)}</span></div>`;
      },
    },
    // Deliberate exception to `resolveCartesianGrid` — do NOT "unify" this.
    // `containLabel` reserves room for axis *labels* only, never for docked
    // components, and heatmap docks three of them: the vertical dataZoom slider
    // (left: 0, width: 16), the horizontal dataZoom slider (bottom: 0, height: 16)
    // and the `visualMap` colour bar (bottom: 0). These insets are that reserved
    // space; the shared tight padding makes the y-labels collide with the slider.
    // Without zoom there is no slider to clear: only the colour bar below.
    grid: enableZoom
      ? { left: 56, right: 24, top: 24, bottom: 48, containLabel: true }
      : { left: 12, right: 12, top: 12, bottom: 44, containLabel: true },
    xAxis: {
      type: "category",
      data: xLabels,
      splitArea: { show: true },
      axisLabel: { interval: 0, ...(tiltX ? { rotate: 35 } : {}) },
    },
    yAxis: {
      type: "category",
      data: yLabels,
      splitArea: { show: true },
      axisLabel: { interval: 0 },
    },
    ...(enableZoom ? { dataZoom: buildHeatmapDataZoom(true) } : {}),
    visualMap: {
      min,
      max,
      calculable: true,
      precision,
      itemWidth: 10,
      itemHeight: 120,
      orient: "horizontal",
      left: "center",
      bottom: 0,
      inRange: {
        color: Array.from({ length: colorStops }, (_, index) =>
          ctx.resolveColor(colorKey, Math.min(index, Math.max(themeColors.length - 1, 0))),
        ),
      },
    },
    series: [
      {
        type: "heatmap",
        // Series id is how the rest of the library identifies a series, and a
        // click without one maps to an empty `seriesKey` and gets dropped.
        id: colorKey,
        data,
        // Allowed painted seam: a heatmap has no geometric gap, so a border in the
        // canvas colour opens the `gap.seam` between cells. Set here, nowhere else.
        itemStyle: {
          borderColor: resolveCanvasGapColor(ctx.chartId),
          borderWidth: gap.seam,
          borderRadius: radius.mark,
        },
        label: { show: false },
        ...hoverFocusOrOff(isHoverFocusOn(ctx), itemFocus({ family: "heatmap" })),
      },
    ],
  };

  return applyChartUiToOption(ctx, base);
}
