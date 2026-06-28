import type { EChartsOption } from "echarts";
import { getColorsCount } from "@/registry/ui/chart";
import { applyChartUiToOption } from "./apply-chart-ui";
import { CHART_CORNER_RADIUS_PX } from "./chart-corner-radius";
import { RADIAL_BAR_MIN_ANGLE, radialBarSeriesFocus } from "./emphasis-presets";
import type { CompileContext, RadialBarPart } from "./parts/types";
import { resolveCanvasChartChrome } from "./resolve-chart-chrome";

const DEFAULT_INNER_RADIUS = "30%";
const DEFAULT_OUTER_RADIUS = "100%";
const DEFAULT_CORNER_RADIUS = CHART_CORNER_RADIUS_PX;
const DEFAULT_BAR_SIZE = 14;
const RADIAL_TRACK_SERIES_ID = "__radial_track__";

function buildConcentricTrackSeries(
  angleMax: number,
  rowCount: number,
  barSize: number,
  cornerRadius: number,
  trackColor: string,
) {
  return {
    type: "bar" as const,
    id: RADIAL_TRACK_SERIES_ID,
    coordinateSystem: "polar" as const,
    silent: true,
    animation: false,
    z: 1,
    barWidth: barSize,
    roundCap: true,
    tooltip: { show: false },
    emphasis: { disabled: true },
    select: { disabled: true },
    data: Array.from({ length: rowCount }, () => ({
      value: angleMax,
      itemStyle: {
        color: trackColor,
        opacity: 0.35,
        borderRadius: cornerRadius,
      },
    })),
  };
}

function buildRoseTrackSeries(
  radiusMax: number,
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
    silent: true,
    animation: false,
    z: 1,
    ...(barSize != null ? { barWidth: barSize } : {}),
    roundCap: true,
    tooltip: { show: false },
    emphasis: { disabled: true },
    select: { disabled: true },
    data: Array.from({ length: rowCount }, (_, i) => ({
      value: radiusMax,
      name: categories[i],
      itemStyle: {
        color: trackColor,
        opacity: 0.35,
        borderRadius: cornerRadius,
      },
    })),
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

function shadowColorFromItem(color: string | object, configKey: string, ctx: CompileContext): string {
  return typeof color === "string" ? color : ctx.resolveColor(configKey, 0);
}

function variantAngles(semi: boolean) {
  if (semi) {
    return { startAngle: 180, endAngle: 0, center: ["50%", "70%"] as [string, string] };
  }
  return { startAngle: 90, endAngle: -270, center: ["50%", "50%"] as [string, string] };
}

export function compileRadialBarOption(ctx: CompileContext): EChartsOption {
  const radial = ctx.parts.find((p): p is RadialBarPart => p.type === "radialBar");
  const valueKey = radial?.dataKey ?? "value";
  const nameKey = getNameKey(ctx);
  const semi = ctx.radial?.radialVariant === "semi";
  const { startAngle, endAngle, center } = variantAngles(semi);

  const innerRadius = ctx.radial?.radialInnerRadius ?? DEFAULT_INNER_RADIUS;
  const outerRadius = ctx.radial?.radialOuterRadius ?? DEFAULT_OUTER_RADIUS;
  const cornerRadius = radial?.cornerRadius ?? DEFAULT_CORNER_RADIUS;
  const barSize = radial?.barSize ?? DEFAULT_BAR_SIZE;
  const showBackground = radial?.showBackground ?? true;
  const glowingBars = new Set(radial?.glowingBars ?? []);

  const chrome = resolveCanvasChartChrome(ctx.chartId);
  const trackColor = chrome.splitLine;

  const categories = ctx.data.map((row) => {
    const key = configKeyFromRow(row, nameKey);
    return ctx.config[key]?.label?.toString() ?? key;
  });

  const numericValues = ctx.data.map((row) => Number(row[valueKey] ?? 0));
  const angleMax = Math.max(...numericValues, 1);

  const showLabels = radial?.showLabels ?? true;

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
    const glowing = glowingBars.has(configKey);
    const shadowColor = shadowColorFromItem(color, configKey, ctx);

    return {
      type: "bar" as const,
      coordinateSystem: "polar" as const,
      name: categories[i],
      stack: "ring",
      z: 2,
      data: numericValues.map((v, j) => (j === i ? v : null)),
      barWidth: barSize,
      barMinAngle: RADIAL_BAR_MIN_ANGLE,
      roundCap: true,
      showBackground: false,
      label: { show: false },
      itemStyle: {
        color,
        borderRadius: cornerRadius,
        ...(glowing
          ? { shadowBlur: 12, shadowColor, shadowOffsetX: 0, shadowOffsetY: 0 }
          : {}),
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
    /** Concentric ring per category (innermost row first). */
    radiusAxis: {
      type: "category",
      data: categories,
      // Draw labels above the arcs and halo each glyph with the chart
      // background so the ring name stays legible whether it sits over a
      // coloured arc, the muted track, or an empty gap.
      z: 10,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: {
        show: showLabels,
        // Show every ring name — a category axis otherwise auto-thins labels
        // it thinks collide, which is why only a couple appeared.
        interval: 0,
        color: chrome.foreground,
        fontSize: 11,
        fontWeight: 500,
        textBorderColor: chrome.background,
        textBorderWidth: 3,
      },
      splitLine: { show: false },
    },
    series: [
      ...(showBackground
        ? [buildConcentricTrackSeries(angleMax, ringSeries.length, barSize, cornerRadius, trackColor)]
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
  const { startAngle, endAngle, center } = variantAngles(semi);

  const innerRadius = ctx.radial?.radialInnerRadius ?? 0;
  const outerRadius = ctx.radial?.radialOuterRadius ?? DEFAULT_OUTER_RADIUS;
  const cornerRadius = radial?.cornerRadius ?? DEFAULT_CORNER_RADIUS;
  const barSize = radial?.barSize;
  const showBackground = radial?.showBackground ?? false;
  const glowingBars = new Set(radial?.glowingBars ?? []);

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
    const glowing = glowingBars.has(configKey);
    const shadowColor = shadowColorFromItem(color, configKey, ctx);

    return {
      type: "bar" as const,
      coordinateSystem: "polar" as const,
      name: categories[i],
      stack: "petal",
      z: 2,
      data: numericValues.map((v, j) => (j === i ? v : null)),
      ...(barSize != null ? { barWidth: barSize } : {}),
      barMinAngle: RADIAL_BAR_MIN_ANGLE,
      roundCap: true,
      showBackground: false,
      itemStyle: {
        color,
        borderRadius: cornerRadius,
        ...(glowing
          ? { shadowBlur: 12, shadowColor, shadowOffsetX: 0, shadowOffsetY: 0 }
          : {}),
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
      // Name each petal by default; opt out with <RadialBar showLabels={false} />.
      axisLabel: {
        show: radial?.showLabels ?? true,
        color: chrome.muted,
        fontSize: 11,
      },
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
        ? [buildRoseTrackSeries(radiusMax, petalSeries.length, categories, barSize, cornerRadius, trackColor)]
        : []),
      ...petalSeries,
    ],
  };

  return applyChartUiToOption(ctx, base);
}
