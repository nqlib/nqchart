/**
 * Reference lines / bands → ECharts markLine / markArea on a silent synthetic series.
 */

import type { EChartsOption } from "echarts";
import { REFERENCE_SERIES_ID } from "./nq-mark-event";
import type { CompileContext, ReferenceBandPart, ReferenceLinePart, YAxisPart } from "./parts/types";
import { resolveYAxisIndex } from "./cartesian-axes";

export type ReferenceTone = "neutral" | "accent" | "positive" | "warning" | "critical";

const TONE_FALLBACK: Record<ReferenceTone, string> = {
  neutral: "oklch(0.55 0.02 60)",
  accent: "var(--chart-1)",
  positive: "oklch(0.55 0.14 145)",
  warning: "oklch(0.7 0.14 75)",
  critical: "oklch(0.6 0.15 25)",
};

function resolveToneColor(tone: ReferenceTone | undefined, chartId: string): string {
  const t = tone ?? "neutral";
  if (typeof document === "undefined") return TONE_FALLBACK[t];

  const el =
    document.querySelector(`[data-chart="${chartId}"]`) ?? document.documentElement;
  const varName =
    t === "critical"
      ? "--destructive"
      : t === "accent"
        ? "--chart-1"
        : t === "positive"
          ? "--chart-2"
          : t === "warning"
            ? "--chart-4"
            : "--muted-foreground";
  const value = getComputedStyle(el).getPropertyValue(varName).trim();
  return value || TONE_FALLBACK[t];
}

function lineType(variant?: ReferenceLinePart["variant"]): "solid" | "dashed" | "dotted" {
  if (variant === "solid") return "solid";
  if (variant === "dotted") return "dotted";
  return "dashed";
}

function labelPosition(
  pos?: ReferenceLinePart["labelPosition"],
): "start" | "middle" | "end" {
  if (pos === "start" || pos === "middle") return pos;
  return "end";
}

export function buildReferenceSeries(ctx: CompileContext): EChartsOption["series"] | null {
  const lines = ctx.parts.filter((p): p is ReferenceLinePart => p.type === "referenceLine");
  const bands = ctx.parts.filter((p): p is ReferenceBandPart => p.type === "referenceBand");
  if (!lines.length && !bands.length) return null;

  const yAxes = ctx.parts.filter((p): p is YAxisPart => p.type === "yAxis");
  // Bind marks to the first referenced axis (default left / 0).
  const primaryAxisId =
    lines.find((l) => l.yAxisId)?.yAxisId ??
    bands.find((b) => b.yAxisId)?.yAxisId;
  const yAxisIndex = resolveYAxisIndex(primaryAxisId, yAxes);

  const markLineData = lines.map((line) => {
    const color = resolveToneColor(line.tone, ctx.chartId);
    const coord =
      line.y != null
        ? { yAxis: line.y }
        : line.x != null
          ? { xAxis: line.x }
          : null;
    if (!coord) return null;
    return {
      ...coord,
      name: line.label,
      label: {
        show: Boolean(line.label),
        formatter: line.label ?? "",
        position: labelPosition(line.labelPosition),
        color,
      },
      lineStyle: {
        color,
        type: lineType(line.variant),
        width: 1.5,
      },
    };
  }).filter(Boolean);

  const markAreaData = bands.map((band) => {
    const color = resolveToneColor(band.tone, ctx.chartId);
    const opacity = band.opacity ?? 0.12;
    if (band.y) {
      return [
        {
          yAxis: band.y[0],
          itemStyle: { color, opacity },
          name: band.label,
          label: band.label
            ? { show: true, position: "inside", color }
            : { show: false },
        },
        { yAxis: band.y[1] },
      ];
    }
    if (band.x) {
      return [
        {
          xAxis: band.x[0],
          itemStyle: { color, opacity },
          name: band.label,
          label: band.label
            ? { show: true, position: "inside", color }
            : { show: false },
        },
        { xAxis: band.x[1] },
      ];
    }
    return null;
  }).filter(Boolean);

  return [
    {
      type: "line",
      id: REFERENCE_SERIES_ID,
      name: "",
      data: [],
      silent: true,
      tooltip: { show: false },
      legendHoverLink: false,
      yAxisIndex,
      markLine: markLineData.length
        ? {
            symbol: "none",
            animation: false,
            data: markLineData,
          }
        : undefined,
      markArea: markAreaData.length
        ? {
            silent: true,
            animation: false,
            data: markAreaData,
          }
        : undefined,
      z: 0,
    },
  ] as EChartsOption["series"];
}

/** Append reference series and exclude them from legend. */
export function withReferenceMarks(
  ctx: CompileContext,
  option: EChartsOption,
): EChartsOption {
  const ref = buildReferenceSeries(ctx);
  if (!ref) return option;
  const existing = option.series
    ? Array.isArray(option.series)
      ? option.series
      : [option.series]
    : [];
  return {
    ...option,
    series: [...existing, ...(Array.isArray(ref) ? ref : [ref])] as EChartsOption["series"],
  };
}
