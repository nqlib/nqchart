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
 * `"points"` / `"dots"` are markers-only (composed box-plot medians, dumbbell ends), not a dash.
 * Area's `dashed-stroke` contains `"dashed"` so it stays dashed.
 */
export function lineStyleType(variant?: string): "solid" | "dashed" | "dotted" {
  if (!variant || variant === "points" || variant === "dots" || variant === "solid") return "solid";
  if (variant.includes("dashed")) return "dashed";
  if (variant.includes("dotted")) return "dotted";
  return "solid";
}

/**
 * Epoch ms for a time-axis x value: a `Date`, a number (epoch ms), or a string.
 * A date-only string (`2026-03-01`) is local midnight, not UTC midnight: ECharts
 * labels a time axis in local time, so UTC midnight reads as the previous day
 * west of Greenwich. `null` when the value does not parse.
 */
export function timeValue(raw: unknown): number | null {
  if (raw instanceof Date) {
    const t = raw.getTime();
    return Number.isFinite(t) ? t : null;
  }
  if (typeof raw === "number") return Number.isFinite(raw) ? raw : null;
  if (typeof raw !== "string" || raw.trim() === "") return null;
  const day = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw.trim());
  if (day) return new Date(Number(day[1]), Number(day[2]) - 1, Number(day[3])).getTime();
  const t = Date.parse(raw);
  return Number.isFinite(t) ? t : null;
}

/**
 * On a log axis, 0 and negative values have no position. They become a gap so
 * they do not collapse the axis extent (one 0 turned a 1–1000 axis into 1–10).
 */
export function logSafeValue(value: number | null, log: boolean): number | null {
  return log && value != null && value <= 0 ? null : value;
}

/** A point on a time x axis. `name` keeps the row's own x text for the tooltip heading. */
export type TimePoint = { name: string; value: [number, number | null] };

/**
 * Series data for a time x axis: one `{ name, value: [t, v] }` per row.
 * A row whose x does not parse stays in place as `null`, so `dataIndex` still
 * matches `ctx.data` for clicks and selection.
 */
export function timeSeriesData(
  rows: readonly Record<string, unknown>[],
  xKey: string,
  valueKey: string,
  log = false,
): Array<TimePoint | null> {
  return rows.map((row) => {
    const t = timeValue(row[xKey]);
    if (t == null) return null;
    return {
      name: String(row[xKey] ?? ""),
      value: [t, logSafeValue(seriesValue(row[valueKey]), log)],
    };
  });
}
