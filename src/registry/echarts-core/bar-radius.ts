import { CHART_BAR_CORNER_RADIUS_PX } from "./chart-corner-radius";
import type { BarSeriesPart } from "./parts/types";
import { resolveCanvasGapColor } from "./resolve-chart-chrome";
import { resolveChartSignature } from "./chart-signature";

/** Default top-rounded bar corners — nqui `--radius-sm` at 16px root. */
export const DEFAULT_BAR_RADIUS = CHART_BAR_CORNER_RADIUS_PX;

/**
 * A segment's place in its same-sign stack, counted outward from the zero line.
 *
 * - `only`: the lone segment of its sign. No seam; the outer end rounds by sign.
 * - `top` / `bottom`: the outermost positive / negative segment, with segments below it.
 * - `baseTop` / `baseBottom`: the segment on the zero line, with segments beyond it.
 * - `middle`: between two segments.
 *
 * Every end that faces a neighbour (a seam) takes the join radius; the end on
 * the zero line stays square.
 */
export type StackCornerRole =
  | "only"
  | "bottom"
  | "middle"
  | "top"
  | "baseTop"
  | "baseBottom";

export function barBorderRadius(
  radius: number,
  horizontal: boolean,
): [number, number, number, number] {
  if (radius <= 0) return [0, 0, 0, 0];
  return horizontal ? [0, radius, radius, 0] : [radius, radius, 0, 0];
}

/** Outer end of a negative bar: bottom when vertical, left when horizontal. */
export function negativeBarBorderRadius(
  radius: number,
  horizontal: boolean,
): [number, number, number, number] {
  if (radius <= 0) return [0, 0, 0, 0];
  return horizontal ? [radius, 0, 0, radius] : [0, 0, radius, radius];
}

/**
 * Round the end away from zero. A positive bar rounds its far end, a negative
 * bar rounds the opposite end, and zero has no radius. The zero line stays square.
 */
export function signedBarBorderRadius(
  value: number | null | undefined,
  radius: number,
  horizontal: boolean,
): [number, number, number, number] {
  if (value == null || value === 0) return [0, 0, 0, 0];
  return value > 0
    ? barBorderRadius(radius, horizontal)
    : negativeBarBorderRadius(radius, horizontal);
}

/** Corners as `[topLeft, topRight, bottomRight, bottomLeft]`. */
type Corners = [number, number, number, number];

/**
 * Round the ends of a stacked segment: `outer` at the open end, `join` at a seam,
 * square on the zero line. "High" is the top (or right) end, "low" the bottom (or left).
 */
function stackedCorners(
  role: StackCornerRole,
  outer: number,
  join: number,
  horizontal: boolean,
): Corners {
  const high = (r: number): Corners => (horizontal ? [0, r, r, 0] : [r, r, 0, 0]);
  const low = (r: number): Corners => (horizontal ? [r, 0, 0, r] : [0, 0, r, r]);
  const add = (a: Corners, b: Corners): Corners => [
    a[0] + b[0],
    a[1] + b[1],
    a[2] + b[2],
    a[3] + b[3],
  ];
  switch (role) {
    case "top":
      return add(high(outer), low(join));
    case "bottom":
      return add(low(outer), high(join));
    case "baseTop":
      return high(join);
    case "baseBottom":
      return low(join);
    case "middle":
      return [join, join, join, join];
    case "only":
      return [0, 0, 0, 0];
  }
}

/**
 * Seam between two stacked segments.
 *
 * ECharts draws no geometric gap between stacked bars, and `BarView` takes
 * `Math.min(borderWidth, w, h)` of a scalar width (a per-side array becomes NaN
 * and the segment vanishes). A canvas-background `borderWidth` would be centred
 * on every edge, so it shrinks the bar at the zero line and the outer end too.
 * The allowed exception to "real space over painted seams" is therefore a
 * zero-blur shadow in the canvas background color, offset by the seam toward the
 * zero line: it paints one seam of background over the end of the segment below
 * and nothing else. Segments are drawn inner to outer, so the shadow always lands
 * on the neighbour. The segment on the zero line and a lone segment get none.
 */
export function stackSegmentGapStyle(
  role: StackCornerRole,
  seam: number,
  gapColor: string,
  horizontal: boolean,
  value: number | null | undefined,
): {
  shadowColor?: string;
  shadowBlur?: number;
  shadowOffsetX?: number;
  shadowOffsetY?: number;
} {
  if (role === "only" || role === "baseTop" || role === "baseBottom") return {};
  if (seam <= 0 || value == null || value === 0) return {};
  // Toward zero: down for a positive vertical segment, up for a negative one;
  // left for a positive horizontal segment, right for a negative one.
  const toward = (value > 0 ? 1 : -1) * seam;
  return horizontal
    ? { shadowColor: gapColor, shadowBlur: 0, shadowOffsetX: -toward, shadowOffsetY: 0 }
    : { shadowColor: gapColor, shadowBlur: 0, shadowOffsetX: 0, shadowOffsetY: toward };
}

/** The signature seam width and its canvas-background color for one chart. */
export function resolveStackSeam(chartId: string): { seam: number; gapColor: string } {
  return {
    seam: resolveChartSignature(chartId).gap.seam,
    gapColor: resolveCanvasGapColor(chartId),
  };
}

/**
 * Per-datum radius.
 *
 * `"top"` is the outer end of the positive stack (top, or the right end when
 * horizontal). `"bottom"` is the outer end of the negative stack. `"middle"`
 * is square. With no role, the sign of `value` picks the outer end, and zero
 * stays square. The end on the zero line is never rounded.
 */
export function barItemBorderRadius(
  variant: string | undefined,
  role: StackCornerRole | undefined,
  radius: number,
  horizontal: boolean,
  value?: number | null,
  join: number = radius,
): [number, number, number, number] {
  if (variant === "stripped") return [0, 0, 0, 0];
  if (value == null || value === 0 || radius <= 0) return [0, 0, 0, 0];
  if (role == null || role === "only") return signedBarBorderRadius(value, radius, horizontal);
  return stackedCorners(role, radius, join, horizontal);
}

/**
 * Explicit part radius wins, then an explicit chart-level `barRadius`, then
 * the signature `radius.mark` (live `--radius-sm`) for this chart's subtree.
 * Pass `chartId` on render paths so a host that retunes `--radius` gets
 * matching corners; without it this falls back to the build-time constant.
 */
export function resolveBarRadius(
  partRadius: number | undefined,
  chartRadius: number | undefined,
  chartId?: string,
): number {
  if (partRadius != null) return partRadius;
  if (chartRadius != null) return chartRadius;
  if (chartId != null) return resolveChartSignature(chartId).radius.mark;
  return DEFAULT_BAR_RADIUS;
}

/**
 * Radius where two segments of one stack meet. Follows the signature `radius.join`,
 * unless the bar carries an explicit radius, which then rounds the seams too.
 */
export function resolveBarJoinRadius(
  partRadius: number | undefined,
  chartRadius: number | undefined,
  chartId?: string,
): number {
  if (partRadius != null) return partRadius;
  if (chartRadius != null) return chartRadius;
  if (chartId != null) return resolveChartSignature(chartId).radius.join;
  return DEFAULT_BAR_RADIUS;
}

/**
 * Per-series corner roles for each category.
 *
 * ECharts `stackStrategy: "samesign"` draws the positive stack and the negative
 * stack apart, both starting at zero. Within one sign, series order runs from
 * the zero line outward, so only the last non-zero segment of that sign is
 * `"top"` (positive) or `"bottom"` (negative). Every other segment is `"middle"`.
 */
export function buildStackCornerRoles(
  stackBars: Array<{ dataKey: string }>,
  rows: Record<string, unknown>[],
): Map<string, StackCornerRole[]> {
  const roles = new Map<string, StackCornerRole[]>();
  for (const bar of stackBars) roles.set(bar.dataKey, []);

  for (let dataIndex = 0; dataIndex < rows.length; dataIndex++) {
    const row = rows[dataIndex] ?? {};
    const positive: Array<{ dataKey: string }> = [];
    const negative: Array<{ dataKey: string }> = [];

    for (const bar of stackBars) {
      const n = Number(row[bar.dataKey]);
      if (!Number.isFinite(n) || n === 0) continue;
      if (n > 0) positive.push(bar);
      else negative.push(bar);
    }

    assignStackRoles(positive, "top", "baseTop", dataIndex, roles);
    assignStackRoles(negative, "bottom", "baseBottom", dataIndex, roles);
  }

  return roles;
}

/**
 * Corner roles for every stacked bar, grouped by stack id. A bar with no `stackId`
 * joins `defaultStack` when one is given (the bar family's chart-level stack);
 * otherwise it is unstacked and gets no role.
 */
export function groupStackRoles(
  bars: Pick<BarSeriesPart, "dataKey" | "stackId">[],
  rows: Record<string, unknown>[],
  defaultStack?: string,
): Map<string, StackCornerRole[]> {
  const rolesByKey = new Map<string, StackCornerRole[]>();
  const groups = new Map<string, Pick<BarSeriesPart, "dataKey" | "stackId">[]>();

  for (const bar of bars) {
    const stackId = bar.stackId ?? defaultStack;
    if (!stackId) continue;
    const group = groups.get(stackId) ?? [];
    group.push(bar);
    groups.set(stackId, group);
  }

  for (const groupBars of groups.values()) {
    const groupRoles = buildStackCornerRoles(groupBars, rows);
    for (const [dataKey, roles] of groupRoles) {
      rolesByKey.set(dataKey, roles);
    }
  }

  return rolesByKey;
}

function assignStackRoles(
  active: Array<{ dataKey: string }>,
  outer: StackCornerRole,
  base: StackCornerRole,
  dataIndex: number,
  roles: Map<string, StackCornerRole[]>,
) {
  const last = active.length - 1;
  for (let i = 0; i < active.length; i++) {
    const bar = active[i]!;
    const role: StackCornerRole =
      last === 0 ? "only" : i === last ? outer : i === 0 ? base : "middle";
    roles.get(bar.dataKey)![dataIndex] = role;
  }
}
