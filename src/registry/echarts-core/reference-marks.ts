/**
 * Reference lines / bands → ECharts markLine / markArea.
 * One silent series per resolved y-axis so a right-axis mark uses that scale.
 * RangeArea → stacked transparent base + (high − low) fill, with gaps on nulls.
 */

import type { EChartsOption, YAXisComponentOption } from "echarts";
import { seriesValue } from "./cartesian-series";
import { headlessThemeOf } from "./headless-theme";
import type { CompileContext, RangeAreaPart, ReferenceBandPart, ReferenceLinePart, YAxisPart } from "./parts/types";

export type ReferenceTone = "neutral" | "accent" | "positive" | "warning" | "critical";

const TONE_FALLBACK: Record<ReferenceTone, string> = {
  neutral: "oklch(0.55 0.02 60)",
  accent: "var(--chart-1)",
  positive: "oklch(0.55 0.14 145)",
  warning: "oklch(0.7 0.14 75)",
  critical: "oklch(0.6 0.15 25)",
};

type AxisExtent = { min: number; max: number };

const unknownAxisWarnings = new Set<string>();

function resolveToneColor(tone: ReferenceTone | undefined, chartId: string): string {
  const t = tone ?? "neutral";
  const theme = headlessThemeOf(chartId);
  if (theme) return theme.tones[t];
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

/**
 * `end` anchors the text on the axis and draws it outward, onto the ticks.
 * The inside* positions inset along the line and lift the text off the stroke.
 */
function labelPosition(
  pos?: ReferenceLinePart["labelPosition"],
): "insideStartTop" | "insideMiddleTop" | "insideEndTop" {
  if (pos === "start") return "insideStartTop";
  if (pos === "middle") return "insideMiddleTop";
  return "insideEndTop";
}

/** [inset from the line end, gap above the stroke]. */
const MARK_LINE_LABEL_DISTANCE: [number, number] = [64, 6];

/**
 * Room above the plot when a labeled line is the axis max.
 * `inside*Top` draws the glyphs above the stroke; 14px of grid padding clips them.
 */
const TOP_EDGE_LABEL_PAD = 28;

function warnUnknownAxis(chartId: string, yAxisId: string) {
  if (process.env.NODE_ENV === "production") return;
  const key = `${chartId}\0${yAxisId}`;
  if (unknownAxisWarnings.has(key)) return;
  unknownAxisWarnings.add(key);
  console.warn(
    `[nqchart] Unknown yAxisId "${yAxisId}" on a reference mark; using axis 0.`,
  );
}

/** Axis 0 when the mark names nothing or names an id this chart does not have. */
function resolveMarkAxis(
  yAxisId: string | undefined,
  yAxes: YAxisPart[],
  chartId: string,
): number {
  if (!yAxisId) return 0;
  const byId = yAxes.findIndex((ya) => ya.yAxisId === yAxisId);
  if (byId >= 0) return byId;
  if (yAxisId === "right") {
    const rightIdx = yAxes.findIndex(
      (ya) => ya.orientation === "right" || ya.yAxisId === "right",
    );
    if (rightIdx >= 0) return rightIdx;
  }
  warnUnknownAxis(chartId, yAxisId);
  return 0;
}

function addExtent(extents: Map<number, AxisExtent>, axisIndex: number, value: number) {
  const cur = extents.get(axisIndex);
  if (!cur) {
    extents.set(axisIndex, { min: value, max: value });
    return;
  }
  cur.min = Math.min(cur.min, value);
  cur.max = Math.max(cur.max, value);
}

function yEdge(value: number | null, edge: "min" | "max"): number | "min" | "max" {
  return value == null ? edge : value;
}

type AxisBucket = {
  axisIndex: number;
  lines: ReferenceLinePart[];
  bands: ReferenceBandPart[];
};

function bucketFor(map: Map<number, AxisBucket>, axisIndex: number): AxisBucket {
  let bucket = map.get(axisIndex);
  if (!bucket) {
    bucket = { axisIndex, lines: [], bands: [] };
    map.set(axisIndex, bucket);
  }
  return bucket;
}

function lineCoord(line: ReferenceLinePart): { yAxis: number } | { xAxis: string | number } | null {
  if (line.y != null) return { yAxis: line.y };
  if (line.x != null) return { xAxis: line.x };
  return null;
}

function buildMarkLineData(lines: ReferenceLinePart[], chartId: string) {
  return lines
    .map((line) => {
      const coord = lineCoord(line);
      if (!coord) return null;
      const color = resolveToneColor(line.tone, chartId);
      return {
        ...coord,
        name: line.label,
        label: {
          show: Boolean(line.label),
          formatter: line.label ?? "",
          position: labelPosition(line.labelPosition),
          distance: MARK_LINE_LABEL_DISTANCE,
          color,
        },
        lineStyle: {
          color,
          type: lineType(line.variant),
          width: 1.5,
        },
      };
    })
    .filter((item) => item != null);
}

function buildMarkAreaData(bands: ReferenceBandPart[], chartId: string) {
  return bands
    .map((band) => {
      const color = resolveToneColor(band.tone, chartId);
      const opacity = band.opacity ?? 0.12;
      const label = band.label
        ? { show: true, position: "insideTop" as const, color, distance: 6 }
        : { show: false };
      if (band.y) {
        return [
          {
            yAxis: yEdge(band.y[0], "min"),
            itemStyle: { color, opacity },
            name: band.label,
            label,
          },
          { yAxis: yEdge(band.y[1], "max") },
        ];
      }
      if (band.x) {
        return [
          {
            xAxis: band.x[0],
            itemStyle: { color, opacity },
            name: band.label,
            label,
          },
          { xAxis: band.x[1] },
        ];
      }
      return null;
    })
    .filter((item) => item != null);
}

function referenceSeriesId(chartId: string, axisIndex: number) {
  return `${chartId}-ref-${axisIndex}`;
}

export function buildReferenceSeries(ctx: CompileContext): EChartsOption["series"] | null {
  const built = buildReference(ctx);
  return built?.series ?? null;
}

function buildReference(ctx: CompileContext): {
  series: EChartsOption["series"];
  extents: Map<number, AxisExtent>;
} | null {
  const lines = ctx.parts.filter((p): p is ReferenceLinePart => p.type === "referenceLine");
  const bands = ctx.parts.filter((p): p is ReferenceBandPart => p.type === "referenceBand");
  if (!lines.length && !bands.length) return null;

  const yAxes = ctx.parts.filter((p): p is YAxisPart => p.type === "yAxis");
  const buckets = new Map<number, AxisBucket>();
  const extents = new Map<number, AxisExtent>();

  for (const line of lines) {
    const axisIndex = resolveMarkAxis(line.yAxisId, yAxes, ctx.chartId);
    if (lineCoord(line)) bucketFor(buckets, axisIndex).lines.push(line);
    if (line.includeInDomain !== false && line.y != null && Number.isFinite(line.y)) {
      addExtent(extents, axisIndex, line.y);
    }
  }

  for (const band of bands) {
    const axisIndex = resolveMarkAxis(band.yAxisId, yAxes, ctx.chartId);
    if (band.y || band.x) bucketFor(buckets, axisIndex).bands.push(band);
    if (band.includeInDomain !== false && band.y) {
      for (const value of band.y) {
        if (value != null && Number.isFinite(value)) addExtent(extents, axisIndex, value);
      }
    }
  }

  const series = [...buckets.values()]
    .sort((a, b) => a.axisIndex - b.axisIndex)
    .map((bucket) => {
      const markLineData = buildMarkLineData(bucket.lines, ctx.chartId);
      const markAreaData = buildMarkAreaData(bucket.bands, ctx.chartId);
      return {
        type: "line" as const,
        id: referenceSeriesId(ctx.chartId, bucket.axisIndex),
        name: "",
        data: [] as number[],
        silent: true,
        tooltip: { show: false },
        legendHoverLink: false,
        yAxisIndex: bucket.axisIndex,
        markLine: markLineData.length
          ? {
              symbol: "none" as const,
              animation: false,
              silent: true,
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
      };
    });

  if (!series.length) return null;
  return { series: series as EChartsOption["series"], extents };
}

function buildRangeAreaSeries(ctx: CompileContext): EChartsOption["series"] | null {
  const areas = ctx.parts.filter((p): p is RangeAreaPart => p.type === "rangeArea");
  if (!areas.length) return null;

  const yAxes = ctx.parts.filter((p): p is YAxisPart => p.type === "yAxis");
  const series = areas.flatMap((area, index) => {
    const yAxisIndex = resolveMarkAxis(area.yAxisId, yAxes, ctx.chartId);
    const color = resolveToneColor(area.tone, ctx.chartId);
    const opacity = area.opacity ?? 0.15;
    const stack = `${ctx.chartId}-range-${index}`;
    let lastLabeled = -1;
    const lowData: Array<number | null> = [];
    const spanData: Array<number | null> = [];

    ctx.data.forEach((row, rowIndex) => {
      const low = seriesValue(row[area.lowKey]);
      const high = seriesValue(row[area.highKey]);
      if (low == null || high == null) {
        lowData.push(null);
        spanData.push(null);
        return;
      }
      lowData.push(low);
      spanData.push(high - low);
      lastLabeled = rowIndex;
    });

    const silent = {
      name: "",
      stack,
      yAxisIndex,
      symbol: "none" as const,
      showSymbol: false,
      silent: true,
      legendHoverLink: false,
      connectNulls: false,
      tooltip: { show: false },
      emphasis: { disabled: true },
      z: 0,
    };

    return [
      {
        ...silent,
        type: "line" as const,
        id: `${ctx.chartId}-range-${index}-low`,
        data: lowData,
        lineStyle: { opacity: 0, width: 0 },
        itemStyle: { opacity: 0 },
      },
      {
        ...silent,
        type: "line" as const,
        id: `${ctx.chartId}-range-${index}-span`,
        data: spanData,
        lineStyle: { opacity: 0, width: 0 },
        itemStyle: { color, opacity: 0 },
        areaStyle: { color, opacity },
        label: area.label
          ? {
              show: true,
              position: "top" as const,
              color,
              formatter: (params: { dataIndex?: number }) =>
                params.dataIndex === lastLabeled ? area.label ?? "" : "",
            }
          : { show: false },
      },
    ];
  });

  return series as EChartsOption["series"];
}

function extendBound(current: unknown, mark: number, edge: "min" | "max"): unknown {
  if (current != null) return current;
  return (extent: AxisExtent) => {
    const data = extent[edge];
    const base = Number.isFinite(data) ? data : mark;
    return edge === "min" ? Math.min(base, mark) : Math.max(base, mark);
  };
}

function extendYAxes(
  yAxis: EChartsOption["yAxis"],
  extents: Map<number, AxisExtent>,
): EChartsOption["yAxis"] {
  if (!yAxis || extents.size === 0) return yAxis;

  const apply = (axis: YAXisComponentOption, index: number): YAXisComponentOption => {
    const ext = extents.get(index);
    if (!ext || !axis || typeof axis !== "object") return axis;
    const type = axis.type;
    if (type === "category" || type === "time") return axis;
    return {
      ...axis,
      min: extendBound(axis.min, ext.min, "min") as YAXisComponentOption["min"],
      max: extendBound(axis.max, ext.max, "max") as YAXisComponentOption["max"],
    };
  };

  if (Array.isArray(yAxis)) {
    return yAxis.map((axis, index) => apply(axis, index));
  }
  return apply(yAxis, 0);
}

/** Largest plotted value on one y-axis. Range highs count; they can sit above the lines. */
function axisDataMax(ctx: CompileContext, axisIndex: number, yAxes: YAxisPart[]): number {
  let max = Number.NEGATIVE_INFINITY;
  const consider = (yAxisId: string | undefined, raw: unknown) => {
    if (resolveMarkAxis(yAxisId, yAxes, ctx.chartId) !== axisIndex) return;
    const value = seriesValue(raw);
    if (value != null) max = Math.max(max, value);
  };

  for (const part of ctx.parts) {
    if (part.type === "line" || part.type === "bar" || part.type === "area") {
      for (const row of ctx.data) consider(part.yAxisId, row[part.dataKey]);
    } else if (part.type === "rangeArea") {
      for (const row of ctx.data) {
        consider(part.yAxisId, row[part.lowKey]);
        consider(part.yAxisId, row[part.highKey]);
      }
    }
  }
  return max;
}

/**
 * A label drawn above a line that is the top of the scale leaves the canvas.
 * True when that line is on screen at the axis max (auto domain grew to it,
 * or an explicit domain ends on it).
 */
function labelSitsOnAxisTop(
  line: ReferenceLinePart,
  axis: YAxisPart | undefined,
  dataMax: number,
): boolean {
  if (!line.label || line.y == null || !Number.isFinite(line.y)) return false;
  const explicitMax = axis?.domain?.[1];
  if (explicitMax != null) return line.y >= explicitMax;
  if (line.includeInDomain === false) return false;
  return line.y >= dataMax;
}

function withTopLabelRoom(grid: EChartsOption["grid"]): EChartsOption["grid"] {
  const lift = (item: object) => {
    const top = (item as { top?: number | string }).top;
    const current = typeof top === "number" ? top : 14;
    return { ...item, top: Math.max(current, TOP_EDGE_LABEL_PAD) };
  };
  if (Array.isArray(grid)) return grid.map((item) => (item && typeof item === "object" ? lift(item) : item));
  if (grid && typeof grid === "object") return lift(grid);
  return { top: TOP_EDGE_LABEL_PAD };
}

function appendSeries(
  option: EChartsOption,
  extra: EChartsOption["series"],
): EChartsOption["series"] {
  const existing = option.series
    ? Array.isArray(option.series)
      ? option.series
      : [option.series]
    : [];
  const added = extra ? (Array.isArray(extra) ? extra : [extra]) : [];
  return [...existing, ...added] as EChartsOption["series"];
}

/** Append reference and range series, and extend axes to include marks. */
export function withReferenceMarks(
  ctx: CompileContext,
  option: EChartsOption,
): EChartsOption {
  const ref = buildReference(ctx);
  const range = buildRangeAreaSeries(ctx);
  if (!ref && !range) return option;

  let next: EChartsOption = option;
  if (range) {
    next = { ...next, series: appendSeries(next, range) };
  }
  if (ref) {
    const yAxes = ctx.parts.filter((p): p is YAxisPart => p.type === "yAxis");
    const lines = ctx.parts.filter((p): p is ReferenceLinePart => p.type === "referenceLine");
    const needsTopRoom = lines.some((line) => {
      const axisIndex = resolveMarkAxis(line.yAxisId, yAxes, ctx.chartId);
      return labelSitsOnAxisTop(line, yAxes[axisIndex], axisDataMax(ctx, axisIndex, yAxes));
    });
    next = {
      ...next,
      yAxis: extendYAxes(next.yAxis, ref.extents),
      series: appendSeries(next, ref.series),
      ...(needsTopRoom ? { grid: withTopLabelRoom(next.grid) } : {}),
    };
  }
  return next;
}
