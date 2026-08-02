import type { EChartsOption } from "echarts";
import { getColorsCount } from "@/registry/ui/chart";
import { applyChartUiToOption } from "./apply-chart-ui";
import { resolveChartCornerRadius } from "./chart-corner-radius";
import { HOVER_DIM_OPACITY, RADIAL_BAR_MIN_ANGLE, radialBarSeriesFocus } from "./emphasis-presets";
import type { CompileContext, RadialBarPart } from "./parts/types";
import { resolveCanvasChartChrome } from "./resolve-chart-chrome";
import { CHART_TYPOGRAPHY } from "./chart-typography-tokens";

/**
 * Concentric defaults maximize annular span (outer − inner) so rings can be
 * large *and* separated. Only a thin canvas gutter remains for spoke labels /
 * semi track circles — enough to avoid clip, not a half-empty plot.
 */
const DEFAULT_INNER_RADIUS = "18%";
const DEFAULT_OUTER_RADIUS = "100%";
/** Full + labels: fill most of the card; ~10% gutter for spoke names. */
const CONCENTRIC_LABELED_OUTER_RADIUS = "90%";
/**
 * Semi: center sits near mid-height (`variantAngles`) so a large outer still
 * keeps full-circle tracks on-canvas. Old 70%-center capped outer at ~55% and
 * left the plot looking tiny in consumer cards.
 */
const CONCENTRIC_SEMI_OUTER_RADIUS = "90%";
const CONCENTRIC_SEMI_LABELED_OUTER_RADIUS = "85%";
/**
 * Rose outer when leader-line labels are on — room for labelLine length + text
 * outside the petals (leaders need a real gutter, not a flush edge).
 */
const ROSE_LABELED_OUTER_RADIUS = "78%";
const DEFAULT_BAR_SIZE = 14;
/**
 * Empty share of each radius-axis category band (ring slot).
 * Paired with a wide annular span so gaps read clearly without skinny arcs.
 */
const CONCENTRIC_RING_CATEGORY_GAP = "48%";
/** Air gap between a ring name and the arc / spoke it labels. */
const RADIAL_LABEL_MARGIN = 14;
/** First / second leader segments — keep name clear of the petal tip. */
const ROSE_LABEL_LINE_LENGTH = 18;
const ROSE_LABEL_LINE_LENGTH2 = 12;
const ROSE_LABEL_DISTANCE = 4;
const ROSE_LABEL_SERIES_ID = "__rose_labels__";
const RADIAL_TRACK_SERIES_ID = "__radial_track__";

/**
 * Ring-name rotation from +X (ECharts: 0° = 3 o'clock, CCW-positive `rotate`).
 *
 * Labels sit on the start spoke. Baseline is *perpendicular* to that spoke so
 * glyph height runs radially (can stay < ring thickness) while still tracking
 * `startAngle`: 90° → 0° (readable at 12 o'clock), 45° → −45°, 180° → 90°.
 * Parallel-to-spoke text would run the *word length* through neighboring rings.
 */
function ringLabelRotate(startAngle: number): number {
  return (((startAngle - 90) % 360) + 360) % 360;
}

/** Keep glyph height inside the ring band so neighbors don't collide. */
function ringLabelFontSize(barSize: number): number {
  return Math.max(8, Math.min(CHART_TYPOGRAPHY.markLabel.fontSize, barSize - 4));
}

/**
 * Full-ring / full-petal tracks behind data bars.
 *
 * Must share `stack` with the ring/petal series. A separate unstacked track
 * stack competes for category-band width in ECharts polar layout (`barPolar`):
 * in compact cards the track claims `barWidth` first and data arcs collapse to
 * hairlines. Same-stack + zero values + native `showBackground` draws tracks at
 * the data bars' width without a second column.
 */
function buildConcentricTrackSeries(
  rowCount: number,
  barSize: number,
  cornerRadius: number,
  trackColor: string,
) {
  return {
    type: "bar" as const,
    id: RADIAL_TRACK_SERIES_ID,
    coordinateSystem: "polar" as const,
    /** Same stack as ring series — one shared band width. */
    stack: "ring",
    silent: true,
    animation: false,
    z: 1,
    barWidth: barSize,
    barCategoryGap: CONCENTRIC_RING_CATEGORY_GAP,
    barMinAngle: 0,
    roundCap: true,
    showBackground: true,
    backgroundStyle: {
      color: trackColor,
      opacity: 0.35,
      borderRadius: cornerRadius,
    },
    tooltip: { show: false },
    emphasis: { disabled: true },
    select: { disabled: true },
    blur: { itemStyle: { opacity: HOVER_DIM_OPACITY } },
    data: Array.from({ length: rowCount }, () => ({
      value: 0,
      itemStyle: { color: "transparent", opacity: 0, borderRadius: cornerRadius },
    })),
  };
}

function buildRoseTrackSeries(
  rowCount: number,
  categories: string[],
  barSize: number | undefined,
  cornerRadius: number,
  trackColor: string,
) {
  return {
    type: "bar" as const,
    id: RADIAL_TRACK_SERIES_ID,
    coordinateSystem: "polar" as const,
    stack: "petal",
    silent: true,
    animation: false,
    z: 1,
    ...(barSize != null ? { barWidth: barSize } : {}),
    barMinAngle: 0,
    roundCap: true,
    showBackground: true,
    backgroundStyle: {
      color: trackColor,
      opacity: 0.35,
      borderRadius: cornerRadius,
    },
    tooltip: { show: false },
    emphasis: { disabled: true },
    select: { disabled: true },
    blur: { itemStyle: { opacity: HOVER_DIM_OPACITY } },
    data: Array.from({ length: rowCount }, (_, i) => ({
      value: 0,
      name: categories[i],
      itemStyle: { color: "transparent", opacity: 0, borderRadius: cornerRadius },
    })),
  };
}

/**
 * Leader-line labels for the rose variant.
 *
 * Polar bar has no `labelLine`, so names ride one silent pie over the petals.
 * A *single* pie (equal slices ↔ category bands) is required for ECharts'
 * `avoidLabelOverlap` / `labelLayout` — per-petal pies cannot collide with
 * each other. Leaders start at the polar outer envelope with an intentional
 * air gap (`length` / `length2` / `distanceToLabelLine`), not flush on the fill.
 */
function buildRoseLabelSeries(
  categories: string[],
  startAngle: number,
  center: [string, string],
  outerRadius: string | number,
  labelColor: string,
  lineColor: string,
) {
  return {
    type: "pie" as const,
    id: ROSE_LABEL_SERIES_ID,
    center,
    radius: outerRadius,
    startAngle,
    clockwise: true,
    silent: true,
    animation: false,
    z: 12,
    avoidLabelOverlap: true,
    minShowLabelAngle: 0,
    itemStyle: { color: "transparent", borderWidth: 0 },
    emphasis: { disabled: true },
    tooltip: { show: false },
    label: {
      show: true,
      formatter: "{b}",
      color: labelColor,
      ...CHART_TYPOGRAPHY.sliceLabel,
      overflow: "none" as const,
      distanceToLabelLine: ROSE_LABEL_DISTANCE,
    },
    labelLine: {
      show: true,
      length: ROSE_LABEL_LINE_LENGTH,
      length2: ROSE_LABEL_LINE_LENGTH2,
      lineStyle: { color: lineColor, width: 1 },
    },
    // Shift colliding names rather than stacking on the petal.
    labelLayout: {
      hideOverlap: true,
      moveOverlap: "shiftY" as const,
    },
    // Uniform values → equal slices → mid-angles match the category bands.
    data: categories.map((name) => ({ name, value: 1 })),
  };
}

function getNameKey(ctx: CompileContext): string {
  if (ctx.nameKey) return ctx.nameKey;
  return Object.keys(ctx.data[0] ?? {})[0] ?? "name";
}

function configKeyFromRow(row: Record<string, unknown>, nameKey: string): string {
  return String(row[nameKey] ?? "");
}

function itemColor(configKey: string, ctx: CompileContext): string | object {
  const entry = ctx.config[configKey];
  const count = entry ? getColorsCount(entry) : 1;
  if (count <= 1) return ctx.resolveColor(configKey, 0);

  return {
    type: "linear",
    x: 0,
    y: 0,
    x2: 1,
    y2: 1,
    colorStops: Array.from({ length: count }, (_, i) => ({
      offset: i / (count - 1),
      color: ctx.resolveColor(configKey, i),
    })),
  };
}

function variantAngles(semi: boolean, startAngleOverride?: number) {
  // ECharts: 0° = 3 o'clock, 90° = 12 o'clock. Clockwise sweep from start.
  const startAngle = startAngleOverride ?? (semi ? 180 : 90);
  const sweep = semi ? 180 : 360;
  const endAngle = startAngle - sweep;
  // Semi: slight downward bias so the upper arc reads as the focus, but stay
  // near mid-height so outer can be ~85–90% without clipping track circles.
  const center: [string, string] = semi ? ["50%", "55%"] : ["50%", "50%"];
  return { startAngle, endAngle, center };
}

/** Default polar outer radius — leave canvas gutter so tracks/labels are not clipped. */
function concentricOuterRadius(
  semi: boolean,
  showLabels: boolean,
  userOuter: number | string | undefined,
): number | string {
  if (userOuter != null) return userOuter;
  if (semi) return showLabels ? CONCENTRIC_SEMI_LABELED_OUTER_RADIUS : CONCENTRIC_SEMI_OUTER_RADIUS;
  return showLabels ? CONCENTRIC_LABELED_OUTER_RADIUS : DEFAULT_OUTER_RADIUS;
}

export function compileRadialBarOption(ctx: CompileContext): EChartsOption {
  const radial = ctx.parts.find((p): p is RadialBarPart => p.type === "radialBar");
  const valueKey = radial?.dataKey ?? "value";
  const nameKey = getNameKey(ctx);
  const semi = ctx.radial?.radialVariant === "semi";
  const { startAngle, endAngle, center } = variantAngles(semi, ctx.radial?.radialStartAngle);

  // Ring names sit on the radiusAxis along the start spoke (not in-bar — ECharts
  // has no curved-text primitive, so in-bar words cut straight across the band).
  const showLabels = radial?.showLabels ?? true;
  const innerRadius = ctx.radial?.radialInnerRadius ?? DEFAULT_INNER_RADIUS;
  const outerRadius = concentricOuterRadius(semi, showLabels, ctx.radial?.radialOuterRadius);
  const cornerRadius = radial?.cornerRadius ?? resolveChartCornerRadius(ctx.chartId);
  const barSize = radial?.barSize ?? DEFAULT_BAR_SIZE;
  const showBackground = radial?.showBackground ?? true;
  const labelFontSize = ringLabelFontSize(barSize);

  const chrome = resolveCanvasChartChrome(ctx.chartId);
  const trackColor = chrome.splitLine;

  const categories = ctx.data.map((row) => {
    const key = configKeyFromRow(row, nameKey);
    return ctx.config[key]?.label?.toString() ?? key;
  });

  const numericValues = ctx.data.map((row) => Number(row[valueKey] ?? 0));
  const angleMax = Math.max(...numericValues, 1);

  // One bar series per ring (not one series with N items). This matches the
  // official ECharts polar-bar pattern: multiple series + `focus: "series"` gives
  // stable, flicker-free hover focus, because the dim is applied per whole series
  // rather than by per-item geometry hit-testing (which thrashes across the gaps
  // between concentric rings). Each series carries a value only at its own ring
  // index; a shared stack lets that single bar fill the category band.
  const ringFocus = radialBarSeriesFocus();
  const ringSeries = ctx.data.map((row, i) => {
    const configKey = configKeyFromRow(row, nameKey);
    const color = itemColor(configKey, ctx);

    return {
      type: "bar" as const,
      coordinateSystem: "polar" as const,
      name: categories[i],
      stack: "ring",
      z: 11,
      data: numericValues.map((v, j) => (j === i ? v : null)),
      barWidth: barSize,
      // Match track — gap between ring bands so arcs (and names) don't touch.
      barCategoryGap: CONCENTRIC_RING_CATEGORY_GAP,
      barMinAngle: RADIAL_BAR_MIN_ANGLE,
      roundCap: true,
      showBackground: false,
      label: { show: false },
      itemStyle: {
        color,
        borderRadius: cornerRadius,
      },
      ...ringFocus,
    };
  });

  const base: EChartsOption = {
    tooltip: { trigger: "item" },
    polar: {
      center,
      radius: [innerRadius, outerRadius],
    },
    /** Arc length — one row fills `(value / max) × sweep`. */
    angleAxis: {
      type: "value",
      min: 0,
      max: angleMax,
      startAngle,
      endAngle,
      clockwise: true,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { show: false },
      splitLine: { show: false },
    },
    /**
     * Ring names on the start spoke. Paint *above* rings (z 11) so arcs never
     * cover glyphs; `silent` keeps labels from stealing hover.
     */
    radiusAxis: {
      type: "category",
      data: categories,
      silent: true,
      z: 12,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: {
        show: showLabels,
        interval: 0,
        // Baseline follows startAngle from +X (0° = 3 o'clock).
        rotate: ringLabelRotate(startAngle),
        // Air gap off the arcs — flush names read as colliding with the mark.
        margin: RADIAL_LABEL_MARGIN,
        // Drop a name rather than stack it on a neighbor when bands are tight.
        hideOverlap: true,
        color: chrome.foreground,
        fontWeight: CHART_TYPOGRAPHY.markLabel.fontWeight,
        // Cap to ring thickness — with barCategoryGap, band > barSize; keep
        // glyphs shorter than the arc so neighbors don't collide.
        fontSize: labelFontSize,
        textBorderColor: chrome.background,
        textBorderWidth: 2,
      },
      splitLine: { show: false },
    },
    series: [
      // Track first so its zero values sit at the stack base; rings paint on top.
      ...(showBackground
        ? [buildConcentricTrackSeries(ringSeries.length, barSize, cornerRadius, trackColor)]
        : []),
      ...ringSeries,
    ],
  };

  return applyChartUiToOption(ctx, base);
}

/** Nightingale rose — category on angle, value as radial length (petals from center). */
export function compileRoseBarOption(ctx: CompileContext): EChartsOption {
  const radial = ctx.parts.find((p): p is RadialBarPart => p.type === "radialBar");
  const valueKey = radial?.dataKey ?? "value";
  const nameKey = getNameKey(ctx);
  const semi = ctx.radial?.radialVariant === "semi";
  const { startAngle, endAngle, center } = variantAngles(semi, ctx.radial?.radialStartAngle);

  const showLabels = radial?.showLabels ?? true;
  const innerRadius = ctx.radial?.radialInnerRadius ?? 0;
  // Leave a gutter for leaders when labels are on (pie default 70%). Explicit
  // `outerRadius` still wins — callers that pin 100% accept clip risk.
  const outerRadius =
    ctx.radial?.radialOuterRadius ??
    (showLabels ? ROSE_LABELED_OUTER_RADIUS : DEFAULT_OUTER_RADIUS);
  const cornerRadius = radial?.cornerRadius ?? resolveChartCornerRadius(ctx.chartId);
  const barSize = radial?.barSize;
  const showBackground = radial?.showBackground ?? false;

  const chrome = resolveCanvasChartChrome(ctx.chartId);
  const trackColor = chrome.splitLine;

  const categories = ctx.data.map((row) => {
    const key = configKeyFromRow(row, nameKey);
    return ctx.config[key]?.label?.toString() ?? key;
  });

  const numericValues = ctx.data.map((row) => Number(row[valueKey] ?? 0));
  const radiusMax = Math.max(...numericValues, 1) * 1.05;

  // One bar series per petal + `focus: "series"` — same flicker-free pattern as the
  // concentric variant (see compileRadialBarOption). A shared stack lets each
  // single-value series fill its own angular band without grouping.
  const petalFocus = radialBarSeriesFocus();
  const petalSeries = ctx.data.map((row, i) => {
    const configKey = configKeyFromRow(row, nameKey);
    const color = itemColor(configKey, ctx);

    return {
      type: "bar" as const,
      coordinateSystem: "polar" as const,
      name: categories[i],
      stack: "petal",
      z: 11,
      data: numericValues.map((v, j) => (j === i ? v : null)),
      ...(barSize != null ? { barWidth: barSize } : {}),
      barMinAngle: RADIAL_BAR_MIN_ANGLE,
      roundCap: true,
      showBackground: false,
      itemStyle: {
        color,
        borderRadius: cornerRadius,
      },
      ...petalFocus,
    };
  });

  const base: EChartsOption = {
    tooltip: { trigger: "item" },
    polar: {
      center,
      radius: innerRadius === 0 ? outerRadius : [innerRadius, outerRadius],
    },
    angleAxis: {
      type: "category",
      data: categories,
      startAngle,
      endAngle,
      clockwise: true,
      axisLine: { show: false },
      axisTick: { show: false },
      // Names come from the leader-line series below, not the axis.
      axisLabel: { show: false },
      splitLine: { show: false },
    },
    radiusAxis: {
      type: "value",
      min: 0,
      max: radiusMax,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { show: false },
      splitLine: { show: false },
    },
    series: [
      ...(showBackground
        ? [buildRoseTrackSeries(petalSeries.length, categories, barSize, cornerRadius, trackColor)]
        : []),
      ...petalSeries,
      ...(showLabels
        ? [
            buildRoseLabelSeries(
              categories,
              startAngle,
              center,
              outerRadius,
              chrome.foreground,
              chrome.border,
            ),
          ]
        : []),
    ],
  };

  return applyChartUiToOption(ctx, base);
}
