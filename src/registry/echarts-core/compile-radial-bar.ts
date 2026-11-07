import type { CustomSeriesOption, EChartsOption } from "echarts";
import { getColorsCount } from "./config-colors";
import { applyChartUiToOption } from "./apply-chart-ui";
import { resolveChartSignature } from "./chart-signature";
import { layoutOutsideLabels, sectorPath, type PieSlice } from "./pie-sector-geometry";
import { NQ_DATUM, NQ_SERIES_KEY } from "./nq-mark-event";
import {
  HOVER_DIM_OPACITY,
  RADIAL_BAR_MIN_ANGLE,
  customFocusChild,
  customFocusGroup,
  focusTiming,
  hoverFocusOrOff,
  isHoverFocusOn,
  itemFocus,
  radialBarSeriesFocus,
} from "./emphasis-presets";
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
/** Air gap between a ring name and the arc / spoke it labels. */
const RADIAL_LABEL_MARGIN = 14;
const RADIAL_TRACK_SERIES_ID = "__radial_track__";
const ROSE_PETAL_SERIES_ID = "__rose_petals__";

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
  ringGap: string,
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
    barCategoryGap: ringGap,
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

/** `number` = px; `"NN%"` = percent of `basis`. */
function resolvePx(value: number | string, basis: number): number {
  if (typeof value === "number") return Math.max(0, value);
  const m = /^(-?[\d.]+)%$/.exec(value.trim());
  if (m?.[1]) return Math.max(0, (Number(m[1]) / 100) * basis);
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? Math.max(0, n) : 0;
}

/** Smallest petal length as a share of the ring depth, so tiny values stay hoverable. */
const ROSE_MIN_FRACTION = 0.15;

type RosePetalSpec = {
  values: number[];
  items: Array<Record<string, unknown>>;
  /** ECharts degrees (0° = 3 o'clock, CCW-positive), clockwise sweep over `sweepDeg`. */
  startAngle: number;
  sweepDeg: number;
  center: [string, string];
  innerRadius: number | string;
  outerRadius: number | string;
  /** Value that maps to the full radial depth (max × headroom). */
  radiusMax: number;
  gap: number;
  cornerRadius: number;
  trackColor: string | null;
  focusOn: boolean;
  /** Category names for outside labels; `null` = labels off. */
  labels: string[] | null;
  labelColor: string;
  lineColor: string;
};

/**
 * Rose petals as one custom series with the NQChart signature: equal-angle
 * sectors, radius ∝ value, an even seam between neighbours and circular
 * fillets (`pie-sector-geometry`). Tracks (full-depth sectors) ride in the same
 * group, silent, and dim with their petal.
 */
function buildRosePetalSeries(spec: RosePetalSpec): CustomSeriesOption {
  const { values, items, focusOn } = spec;
  const states = customFocusChild(focusOn);
  const n = values.length;

  type Frame = {
    petals: PieSlice[];
    tracks: string[];
    labels: ReturnType<typeof layoutOutsideLabels>;
  };
  let cached: { key: string; frame: Frame } | null = null;
  const frameFor = (w: number, h: number): Frame => {
    const key = `${w}x${h}`;
    if (cached?.key === key) return cached.frame;
    const halfMin = Math.min(w, h) / 2;
    const cx = resolvePx(spec.center[0], w);
    const cy = resolvePx(spec.center[1], h);
    const rIn = resolvePx(spec.innerRadius, halfMin);
    const rOut = Math.max(resolvePx(spec.outerRadius, halfMin), rIn);
    const depth = rOut - rIn;
    // ECharts degrees → radians clockwise from 12 o'clock.
    const a0 = ((90 - spec.startAngle) * Math.PI) / 180;
    const span = ((spec.sweepDeg * Math.PI) / 180) / Math.max(n, 1);
    const petals: PieSlice[] = [];
    const tracks: string[] = [];
    for (let i = 0; i < n; i++) {
      const start = a0 + i * span;
      const end = start + span;
      const frac = Math.min(1, Math.max(ROSE_MIN_FRACTION, values[i]! / spec.radiusMax));
      const R = rIn + depth * frac;
      const geo = {
        cx,
        cy,
        start,
        end,
        innerRadius: rIn,
        gap: spec.gap,
        cornerRadius: spec.cornerRadius,
      };
      const shape = sectorPath({ ...geo, outerRadius: R });
      const mid = (start + end) / 2;
      petals.push({
        ...shape,
        start,
        end,
        outerRadius: R,
        midAngle: mid,
        centroid: { x: cx, y: cy },
        labelAnchor: { x: cx, y: cy },
      });
      tracks.push(spec.trackColor ? sectorPath({ ...geo, outerRadius: rOut }).path : "");
    }
    // Leader lines start on each petal's own rim — not on the outer envelope —
    // and labels spread per side so they never overlap (same layout as pie).
    const labels = spec.labels
      ? layoutOutsideLabels(petals, cx, cy, { height: h, lineHeight: 16 })
      : petals.map(() => null);
    const frame = { petals, tracks, labels };
    cached = { key, frame };
    return frame;
  };

  return {
    type: "custom",
    id: ROSE_PETAL_SERIES_ID,
    coordinateSystem: "none",
    // Same focus contract as the pie rose: hovered petal stays, siblings dim.
    ...hoverFocusOrOff(focusOn, itemFocus({ dimLabel: true, family: "radial" })),
    blur: { itemStyle: { opacity: HOVER_DIM_OPACITY } },
    ...focusTiming("radial"),
    data: items,
    renderItem(params, api) {
      const idx = params.dataIndex;
      const w = api.getWidth();
      const h = api.getHeight();
      if (idx < 0 || idx >= n || w <= 0 || h <= 0) return;
      const frame = frameFor(w, h);
      const petal = frame.petals[idx];
      if (!petal?.path) return;
      // Legend isolate dims through the item's `itemStyle.opacity`.
      const opacity = Number((api.style() as { opacity?: number }).opacity ?? 1);
      const children: Record<string, unknown>[] = [];
      const track = frame.tracks[idx];
      if (spec.trackColor && track) {
        children.push({
          type: "path",
          silent: true,
          shape: { pathData: track },
          style: { fill: spec.trackColor, opacity: 0.35 * opacity },
          ...states,
        });
      }
      children.push({
        type: "path",
        shape: { pathData: petal.path },
        style: { fill: (items[idx] as { itemStyle: { color: string } }).itemStyle.color, opacity },
        ...states,
      });
      const label = frame.labels[idx];
      if (label && spec.labels) {
        children.push(
          {
            type: "polyline",
            silent: true,
            shape: { points: label.line.map((p) => [p.x, p.y]) },
            style: { stroke: spec.lineColor, lineWidth: 1, fill: "none", opacity },
            ...states,
          },
          {
            type: "text",
            silent: true,
            x: label.x,
            y: label.y,
            style: {
              text: spec.labels[idx],
              fill: spec.labelColor,
              opacity,
              ...CHART_TYPOGRAPHY.sliceLabel,
              textAlign: label.align,
              textVerticalAlign: "middle",
            },
            ...states,
          },
        );
      }
      return { type: "group", ...customFocusGroup(focusOn), children };
    },
  } as CustomSeriesOption;
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
  const signature = resolveChartSignature(ctx.chartId);
  const cornerRadius = radial?.cornerRadius ?? signature.radius.mark;
  // Empty share of each ring slot — the signature's bar category gap.
  const ringGap = signature.bar.categoryGap;
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
  const ringFocus = hoverFocusOrOff(isHoverFocusOn(ctx), radialBarSeriesFocus());
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
      barCategoryGap: ringGap,
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
        ? [buildConcentricTrackSeries(ringSeries.length, barSize, cornerRadius, trackColor, ringGap)]
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
  const { startAngle, center } = variantAngles(semi, ctx.radial?.radialStartAngle);

  const showLabels = radial?.showLabels ?? true;
  const innerRadius = ctx.radial?.radialInnerRadius ?? 0;
  // Leave a gutter for leaders when labels are on (pie default 70%). Explicit
  // `outerRadius` still wins — callers that pin 100% accept clip risk.
  const outerRadius =
    ctx.radial?.radialOuterRadius ??
    (showLabels ? ROSE_LABELED_OUTER_RADIUS : DEFAULT_OUTER_RADIUS);
  const signature = resolveChartSignature(ctx.chartId);
  const cornerRadius = radial?.cornerRadius ?? signature.radius.surface;
  const showBackground = radial?.showBackground ?? false;

  const chrome = resolveCanvasChartChrome(ctx.chartId);
  const trackColor = chrome.splitLine;

  const categories = ctx.data.map((row) => {
    const key = configKeyFromRow(row, nameKey);
    return ctx.config[key]?.label?.toString() ?? key;
  });

  const numericValues = ctx.data.map((row) => Number(row[valueKey] ?? 0));
  const radiusMax = Math.max(...numericValues, 1) * 1.05;
  const focusOn = isHoverFocusOn(ctx);

  const items = ctx.data.map((row, i) => {
    const configKey = configKeyFromRow(row, nameKey);
    return {
      name: categories[i],
      value: numericValues[i],
      itemStyle: { color: itemColor(configKey, ctx) },
      [NQ_SERIES_KEY]: configKey,
      [NQ_DATUM]: row,
    };
  });

  const petals = buildRosePetalSeries({
    values: numericValues,
    items,
    startAngle,
    sweepDeg: semi ? 180 : 360,
    center,
    innerRadius,
    outerRadius,
    radiusMax,
    gap: signature.gap.seam,
    cornerRadius,
    trackColor: showBackground ? trackColor : null,
    focusOn,
    labels: showLabels ? categories.filter((c): c is string => c != null) : null,
    labelColor: chrome.foreground,
    lineColor: chrome.border,
  });

  const base: EChartsOption = {
    tooltip: { trigger: "item" },
    series: [petals],
  };

  return applyChartUiToOption(ctx, base);
}
