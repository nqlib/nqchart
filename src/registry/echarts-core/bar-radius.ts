import {
  CHART_BAR_CORNER_RADIUS_PX,
  resolveChartBarCornerRadius,
} from "./chart-corner-radius";
import type { BarSeriesPart } from "./parts/types";

/** Default top-rounded bar corners — nqui `--radius-sm` at 16px root. */
export const DEFAULT_BAR_RADIUS = CHART_BAR_CORNER_RADIUS_PX;

export type StackCornerRole = "only" | "bottom" | "middle" | "top";

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

export function stackedBarBorderRadius(
  role: StackCornerRole,
  radius: number,
  horizontal: boolean,
): [number, number, number, number] {
  if (radius <= 0) return [0, 0, 0, 0];

  if (horizontal) {
    switch (role) {
      case "bottom":
        return [radius, 0, 0, radius];
      case "middle":
        return [0, 0, 0, 0];
      case "only":
      case "top":
        return [0, radius, radius, 0];
    }
  }

  switch (role) {
    case "bottom":
      return [0, 0, radius, radius];
    case "middle":
      return [0, 0, 0, 0];
    case "only":
    case "top":
      return [radius, radius, 0, 0];
  }
}

export function stackSegmentGapStyle(
  role: StackCornerRole,
  horizontal: boolean,
): {
  borderWidth?: number | [number, number, number, number];
  borderColor?: string;
} {
  // ECharts BarView.getLineWidth() does Math.min(borderWidth, w, h) — array borderWidth
  // becomes NaN and the entire segment is skipped (invisible bottom stack layer).
  // Per-side borders are not supported until we use a custom renderItem gap.
  void role;
  void horizontal;
  return {};
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
): [number, number, number, number] {
  if (variant === "stripped") return [0, 0, 0, 0];
  if (value == null || value === 0 || role === "middle") return [0, 0, 0, 0];
  if (role === "top") return barBorderRadius(radius, horizontal);
  if (role === "bottom") return negativeBarBorderRadius(radius, horizontal);
  return signedBarBorderRadius(value, radius, horizontal);
}

/**
 * Explicit part radius wins, then an explicit chart-level `barRadius`, then
 * the live `--radius-sm` for this chart's subtree. Pass `chartId` on render
 * paths so a host that retunes `--radius` gets matching corners; without it
 * this falls back to the static build-time constant.
 */
export function resolveBarRadius(
  partRadius: number | undefined,
  chartRadius: number | undefined,
  chartId?: string,
): number {
  if (partRadius != null) return partRadius;
  if (chartRadius != null) return chartRadius;
  if (chartId != null) return resolveChartBarCornerRadius(chartId);
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

    assignOuterRole(positive, "top", dataIndex, roles);
    assignOuterRole(negative, "bottom", dataIndex, roles);
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

function assignOuterRole(
  active: Array<{ dataKey: string }>,
  outer: StackCornerRole,
  dataIndex: number,
  roles: Map<string, StackCornerRole[]>,
) {
  for (let i = 0; i < active.length; i++) {
    const bar = active[i]!;
    roles.get(bar.dataKey)![dataIndex] = i === active.length - 1 ? outer : "middle";
  }
}
