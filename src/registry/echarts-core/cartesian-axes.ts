/**
 * Shared cartesian axis option builders — dual Y, tick formatters, scale, dense labels.
 */

import type { XAXisComponentOption, YAXisComponentOption } from "echarts";
import type { XAxisPart, YAxisPart } from "./parts/types";

export type NQScale = "linear" | "log" | "time" | "category";

export type AxisLabelOpts = {
  formatter?: (value: unknown, index: number) => string;
  rotate?: number;
  interval?: number | "auto";
};

function echartsAxisType(
  scale: NQScale | undefined,
  fallback: "category" | "value",
): "category" | "value" | "log" | "time" {
  if (!scale || scale === "linear") return fallback === "category" ? "category" : "value";
  if (scale === "category") return "category";
  if (scale === "log") return "log";
  if (scale === "time") return "time";
  return fallback;
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
    const scale = ya.scale ?? "linear";
    const type = echartsAxisType(scale, "value");
    const label = buildAxisLabel(ya);
    const percentLabel =
      percent && i === 0
        ? { formatter: "{value}%" as const }
        : undefined;

    return {
      type,
      name: ya.unit ?? "",
      position: (ya.orientation === "right" ? "right" : "left") as "left" | "right",
      min: ya.domain?.[0],
      max: percent && i === 0 ? 100 : ya.domain?.[1],
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

export function buildCategoryAxis(opts: {
  categories: unknown[];
  xAxis?: XAxisPart;
  boundaryGap?: boolean;
  hideOverlap?: boolean;
}): XAXisComponentOption {
  const { categories, xAxis, boundaryGap, hideOverlap = true } = opts;
  const scale = xAxis?.scale ?? "category";
  const type = echartsAxisType(scale, "category");
  const label = buildAxisLabel(xAxis, {
    interval: xAxis?.labelInterval ?? 0,
  });

  return {
    type: type === "value" || type === "log" || type === "time" ? type : "category",
    data: type === "category" || !xAxis?.scale || xAxis.scale === "category" || xAxis.scale === "linear"
      ? (categories as string[])
      : undefined,
    inverse: xAxis?.reversed ?? false,
    boundaryGap,
    axisLine: { show: true },
    axisTick: { show: false },
    axisLabel: {
      hideOverlap,
      ...label,
    },
    min: xAxis?.domain?.[0],
    max: xAxis?.domain?.[1],
  } as XAXisComponentOption;
}

/** Merge tickFormatter / scale onto an existing category or value axis option. */
export function applyAxisPartToOption(
  axis: Record<string, unknown>,
  part: XAxisPart | YAxisPart | undefined,
  role: "category" | "value",
): Record<string, unknown> {
  if (!part) return axis;
  const label = buildAxisLabel(part);
  const next = { ...axis };
  if (part.scale && part.scale !== "linear") {
    next.type = echartsAxisType(part.scale, role === "category" ? "category" : "value");
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
