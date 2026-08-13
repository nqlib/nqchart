import type { ChartPart, CompileContext } from "./parts/types";

/**
 * Resolves the category (x) key for a cartesian chart: explicit `xDataKey`,
 * else the registered `<XAxis dataKey>`, else the first data column, else `"x"`.
 * Shared by the line, area, bar, and composed compilers so they stay in sync.
 */
export function getXKey(ctx: CompileContext): string {
  if (ctx.xDataKey) return ctx.xDataKey;
  const xPart = ctx.parts.find((p): p is Extract<ChartPart, { type: "xAxis" }> => p.type === "xAxis");
  if (xPart?.dataKey) return xPart.dataKey;
  return Object.keys(ctx.data[0] ?? {})[0] ?? "x";
}

/** Stringified category axis values for the resolved x key. */
export function categoryValues(ctx: CompileContext, xKey: string): string[] {
  return ctx.data.map((row) => String(row[xKey] ?? ""));
}

/**
 * A datum for a cartesian series, or `null` for a genuine gap.
 *
 * `Number(raw ?? 0)` is the obvious spelling and the wrong one: it turns a
 * missing value into a zero, and a zero is a measurement while a gap is the
 * absence of one. "Actual cost has not landed for May" is not "we spent nothing
 * in May", but plotted as 0 the two are indistinguishable — the reader sees a
 * collapse that never happened.
 *
 * ECharts draws `null` as a break in a line and paints no bar at all, which is
 * what a missing period should look like. Non-numeric junk becomes a gap too,
 * rather than the `NaN` ECharts would otherwise try to lay out.
 *
 * Use this for anything that becomes `series.data`. Do **not** use it for
 * aggregate arithmetic — stack totals, percent-of-total, stack-role detection —
 * where an absent value genuinely contributes zero to a sum.
 */
export function seriesValue(raw: unknown): number | null {
  if (raw == null || raw === "") return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

/**
 * Default point-marker config shared by every line-style series (line, area,
 * and the line series inside composed charts) so markers look identical
 * regardless of which chart root renders the `<Line>`.
 */
export const LINE_MARKER = {
  showSymbol: true,
  symbol: "circle" as const,
  symbolSize: 5,
};

/**
 * Stroke dash from `<Line variant>` / `<Area variant>`.
 *
 * `"points"` is markers-only (composed box-plot medians), not a dash.
 * Area's `dashed-stroke` contains `"dashed"` so it stays dashed.
 */
export function lineStyleType(variant?: string): "solid" | "dashed" | "dotted" {
  if (!variant || variant === "points" || variant === "solid") return "solid";
  if (variant.includes("dashed")) return "dashed";
  if (variant.includes("dotted")) return "dotted";
  return "solid";
}
