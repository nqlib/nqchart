/**
 * The print legend: an ECharts legend for a headless render.
 *
 * In the browser the legend is HTML under the plot (`NQChartLegend`), and the
 * compilers hide the ECharts legend (`hideBuiltInLegend`). A static SVG has no HTML,
 * so this puts the legend back into the option, under the plot.
 *
 * The print legend tells the mark: a block for a bar or an area, the line in its own
 * style for a line (secolab SECO-1508).
 */
import type { EChartsOption } from "echarts";
import { CHART_TYPOGRAPHY } from "@/registry/echarts-core/chart-typography-tokens";
import type { ChartPart, CompileContext, LegendPart, PieSeriesPart } from "@/registry/echarts-core/parts/types";
import { resolveCanvasChartChrome } from "@/registry/echarts-core/resolve-chart-chrome";

/** The height the legend row takes under the plot, like the HTML legend in the browser. */
export const PRINT_LEGEND_HEIGHT_PX = 28;

type LegendEntry = { name: string; icon?: string; itemStyle?: { opacity: number } };

const BLOCK_ICON = "roundRect";

function seriesName(ctx: CompileContext, dataKey: string): string {
  return ctx.config[dataKey]?.label?.toString() ?? dataKey;
}

/** One entry per series part in part order; a line entry has no icon, so ECharts draws its line style. */
function seriesEntries(ctx: CompileContext): LegendEntry[] {
  const entries: LegendEntry[] = [];
  const seen = new Set<string>();
  const push = (entry: LegendEntry) => {
    if (seen.has(entry.name)) return;
    seen.add(entry.name);
    entries.push(entry);
  };
  for (const part of ctx.parts as ChartPart[]) {
    switch (part.type) {
      case "bar":
      case "area":
        if (part.showInLegend === false) break;
        push({ name: seriesName(ctx, part.dataKey), icon: BLOCK_ICON });
        break;
      case "line":
        if (part.showInLegend === false) break;
        // No icon: ECharts draws the series' own line style. The point symbol is
        // hidden so the glyph is a short line, like the desktop legend.
        push({ name: seriesName(ctx, part.dataKey), itemStyle: { opacity: 0 } });
        break;
      default:
        break;
    }
  }
  return entries;
}

/** A pie lists its slices, each a block. */
function pieEntries(ctx: CompileContext, pie: PieSeriesPart): LegendEntry[] {
  const nameKey = pie.nameKey ?? ctx.nameKey ?? Object.keys(ctx.data[0] ?? {})[0] ?? "name";
  return ctx.data.map((row) => {
    const key = String(row[nameKey] ?? "");
    return { name: seriesName(ctx, key), icon: BLOCK_ICON };
  });
}

function raiseGridBottom(grid: EChartsOption["grid"]): EChartsOption["grid"] {
  if (grid == null) return grid;
  const raise = (g: Record<string, unknown>) => {
    const bottom = g.bottom;
    const next = typeof bottom === "number" ? bottom + PRINT_LEGEND_HEIGHT_PX : PRINT_LEGEND_HEIGHT_PX + 32;
    return { ...g, bottom: next };
  };
  if (Array.isArray(grid)) return grid.map((g) => raise(g as Record<string, unknown>)) as EChartsOption["grid"];
  return raise(grid as Record<string, unknown>) as EChartsOption["grid"];
}

/**
 * Put an ECharts legend under the plot when the chart has a visible legend part.
 *
 * `legend` undefined or hidden → the option is returned as given (no legend).
 */
export function printLegend(
  ctx: CompileContext,
  legend: LegendPart | undefined,
  option: EChartsOption,
): EChartsOption {
  if (!legend || legend.hide) return option;

  const pie = ctx.parts.find((p): p is PieSeriesPart => p.type === "pie");
  const data = pie ? pieEntries(ctx, pie) : seriesEntries(ctx);
  if (data.length === 0) return option;

  const chrome = resolveCanvasChartChrome(ctx.chartId);
  const align = legend.align ?? "right";

  return {
    ...option,
    // No root `icon`: it would override the line entries, which must draw their
    // own line style (dashed and dotted included). Bars and areas carry theirs.
    legend: {
      show: true,
      bottom: 0,
      left: align,
      itemWidth: 12,
      itemHeight: 12,
      itemGap: 16,
      // The HTML legend draws its labels in `text-foreground` (ui/legend.tsx).
      textStyle: { fontSize: CHART_TYPOGRAPHY.axis.fontSize, color: chrome.foreground },
      data,
    },
    grid: raiseGridBottom(option.grid),
  };
}
