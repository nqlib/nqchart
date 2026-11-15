/**
 * Shared cartesian axis option builders — dual Y, tick formatters, scale, dense labels.
 */

import type { YAXisComponentOption } from "echarts";
import type { XAxisPart, YAxisPart } from "./parts/types";

export type NQScale = "linear" | "log" | "time" | "category";

export type AxisLabelOpts = {
  formatter?: (value: unknown, index: number) => string;
  rotate?: number;
  interval?: number | "auto";
};

/**
 * ECharts axis type for an axis part's `scale`.
 *
 * A category axis is `category` or, when the chart can place points by time,
 * `time`. A value axis is `value` or `log`. Any other pairing has no meaning
 * (`log` on a category axis, `time` on a bar's category axis) and keeps the
 * axis's own type.
 */
export function axisTypeFor(
  scale: NQScale | undefined,
  role: "category" | "value",
  opts: { time?: boolean } = {},
): "category" | "value" | "log" | "time" {
  if (scale === "time" && opts.time) return "time";
  if (role === "category") return "category";
  return scale === "log" ? "log" : "value";
}

/** True when the part asks for a log scale. */
export function isLogScale(part: { scale?: NQScale } | undefined): boolean {
  return part?.scale === "log";
}

/** True when the x axis part asks for a time scale. */
export function isTimeScale(part: { scale?: NQScale } | undefined): boolean {
  return part?.scale === "time";
}

/** The y axis part that a series with `yAxisId` plots on. */
export function seriesYAxisPart(yAxisId: string | undefined, yAxes: YAxisPart[]): YAxisPart | undefined {
  return yAxes[resolveYAxisIndex(yAxisId, yAxes)];
}

export function buildAxisLabel(
  part: Pick<XAxisPart, "tickFormatter" | "labelRotate" | "labelInterval"> | undefined,
  extras?: Partial<AxisLabelOpts>,
): Record<string, unknown> | undefined {
  const formatter = part?.tickFormatter ?? extras?.formatter;
  const rotate = part?.labelRotate ?? extras?.rotate;
  const interval = part?.labelInterval ?? extras?.interval;
  if (formatter == null && rotate == null && interval == null) return undefined;
  return {
    ...(formatter
      ? {
          formatter: (value: unknown, index: number) => formatter(value, index),
        }
      : {}),
    ...(rotate != null ? { rotate } : {}),
    ...(interval != null ? { interval } : {}),
  };
}

export function resolveYAxisIndex(
  yAxisId: string | undefined,
  yAxes: YAxisPart[],
): number {
  if (!yAxisId || yAxes.length <= 1) return 0;
  const byId = yAxes.findIndex((ya) => ya.yAxisId === yAxisId);
  if (byId >= 0) return byId;
  // Legacy: series asked for "right" when a second axis exists.
  if (yAxisId === "right") {
    const rightIdx = yAxes.findIndex((ya) => ya.orientation === "right" || ya.yAxisId === "right");
    return rightIdx >= 0 ? rightIdx : yAxes.length > 1 ? 1 : 0;
  }
  return 0;
}

export function buildValueYAxes(opts: {
  yAxes: YAxisPart[];
  hasGrid: boolean;
  /** Force percent max/formatter on the primary axis. */
  percent?: boolean;
}): YAXisComponentOption[] {
  const { yAxes, hasGrid, percent } = opts;

  if (!yAxes.length) {
    return [
      {
        type: "value",
        splitLine: {
          show: hasGrid,
          lineStyle: { type: "dotted", opacity: 0.5 },
        },
        ...(percent
          ? { max: 100, axisLabel: { formatter: "{value}%" } }
          : {}),
      },
    ];
  }

  return yAxes.map((ya, i) => {
    const type = axisTypeFor(ya.scale, "value");
    const label = buildAxisLabel(ya);
    const percentLabel =
      percent && i === 0 && type !== "log"
        ? { formatter: "{value}%" as const }
        : undefined;

    return {
      type,
      name: ya.unit ?? "",
      position: (ya.orientation === "right" ? "right" : "left") as "left" | "right",
      min: ya.domain?.[0],
      max: percent && i === 0 && type !== "log" ? 100 : ya.domain?.[1],
      inverse: ya.reversed ?? false,
      splitLine: {
        show: i === 0 && hasGrid,
        lineStyle: { type: "dotted", opacity: 0.5 },
      },
      axisLabel: {
        ...percentLabel,
        ...label,
      },
    } as YAXisComponentOption;
  });
}

/** Merge tickFormatter / scale onto an existing category or value axis option. */
export function applyAxisPartToOption(
  axis: Record<string, unknown>,
  part: XAxisPart | YAxisPart | undefined,
  role: "category" | "value",
  opts: { time?: boolean } = {},
): Record<string, unknown> {
  if (!part) return axis;
  const label = buildAxisLabel(part);
  const next = { ...axis };
  if (part.scale && part.scale !== "linear") {
    next.type = axisTypeFor(part.scale, role, opts);
    // A time axis places points by their own x; a category list would be ignored.
    if (next.type === "time") {
      delete next.data;
      next.boundaryGap = false;
    }
  }
  if ("reversed" in part && part.reversed != null) {
    next.inverse = part.reversed;
  }
  if (label) {
    next.axisLabel = {
      ...((axis.axisLabel as Record<string, unknown>) ?? {}),
      ...label,
    };
  }
  if ("domain" in part && part.domain) {
    next.min = part.domain[0];
    next.max = part.domain[1];
  }
  if ("unit" in part && part.unit) {
    next.name = part.unit;
  }
  if ("orientation" in part && part.orientation) {
    next.position = part.orientation;
  }
  return next;
}
