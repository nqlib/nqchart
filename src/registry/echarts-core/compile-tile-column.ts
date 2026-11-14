import type {
  CustomSeriesOption,
  CustomSeriesRenderItemAPI,
  EChartsOption,
} from "echarts";
import { applyChartUiToOption } from "./apply-chart-ui";
import { gridBottomWithZoom } from "./category-data-zoom";
import { resolveCartesianGrid } from "./chart-grid";
import { resolveChartSignature } from "./chart-signature";
import {
  customFocusChild,
  customFocusGroup,
  focusTiming,
  itemFocus,
  HOVER_DIM_OPACITY,
  hoverFocusOrOff,
  isHoverFocusOn,
} from "./emphasis-presets";
import { NQ_DATUM, NQ_SERIES_KEY } from "./nq-mark-event";
import { CHART_TYPOGRAPHY } from "./chart-typography-tokens";
import type { CompileContext, TileColumnPart } from "./parts/types";

function bandWidthAt(api: CustomSeriesRenderItemAPI, category: number, value: number) {
  const sizeResult = api.size?.([1, 0], [category, value]);
  if (Array.isArray(sizeResult)) return sizeResult[0] ?? 0;
  return Number(sizeResult ?? 0);
}

export type TileColumnRow = {
  name: string;
  value: number;
  tiles: number;
  colors: string[];
  [NQ_SERIES_KEY]: string;
  [NQ_DATUM]: Record<string, unknown>;
};

function defaultBandLabel(band: number): string {
  if (band === 0) return "0";
  if (Math.abs(band) >= 1000) return `${band / 1000}k`;
  return String(band);
}

function resolveBands(part: TileColumnPart | undefined, values: number[]): number[] {
  if (part?.bands && part.bands.length >= 2) return part.bands;
  const count = Math.max(2, part?.bandCount ?? 8);
  const peak = Math.max(0, ...values, 1);
  return Array.from({ length: count + 1 }, (_, i) => (peak * i) / count);
}

function tilesForValue(value: number, bands: number[]): number {
  const rows = bands.length - 1;
  if (rows <= 0) return 0;
  const max = bands[bands.length - 1] ?? 1;
  if (max <= 0) return 0;
  return Math.max(0, Math.min(rows, Math.ceil((value / max) * rows)));
}

function stepColor(
  ctx: CompileContext,
  part: TileColumnPart,
  stepIndex: number,
  stepCount: number,
): string {
  const steps = part.steps;
  if (steps?.length) {
    const key = steps[Math.min(stepIndex, steps.length - 1)]!;
    return ctx.resolveColor(key, 0);
  }
  const index = Math.min(stepIndex, Math.max(stepCount - 1, 0));
  return ctx.resolveColor(part.dataKey, index);
}

/**
 * Skyline of rounded tiles: one column per category, cells only up to the
 * value. Not a heatmap — empty slots above the fill are omitted.
 */
export function compileTileColumnOption(ctx: CompileContext): EChartsOption {
  const part = ctx.parts.find((p): p is TileColumnPart => p.type === "tileColumn");
  if (!part) return { series: [] };

  const categoryKey = part.categoryKey ?? "date";
  const valueKey = part.valueKey ?? "value";
  // One source: the signature (`--radius`, `--chart-gap`); the props override.
  const { radius, gap } = resolveChartSignature(ctx.chartId);
  const cellRadius = part.cellRadius ?? radius.mark;
  const cellGap = part.cellGap ?? gap.seam;
  const rows = (part.rows?.length ? part.rows : ctx.data) as Record<string, unknown>[];
  if (!rows.length) return { series: [] };

  const values = rows.map((row) => Number(row[valueKey] ?? 0));
  const bands = resolveBands(part, values);
  const bandRows = Math.max(1, bands.length - 1);
  const themeColors =
    ctx.config[part.dataKey]?.colors?.light ??
    ctx.config[part.dataKey]?.colors?.dark ??
    [];
  const stepCount = part.steps?.length ?? Math.min(Math.max(themeColors.length, 4), bandRows);

  const xLabels =
    part.xLabels ??
    rows.map((row) => String(row[categoryKey] ?? ""));
  const labelIndices = new Set(
    part.xLabelIndices ??
      (xLabels.length <= 2 ? xLabels.map((_, i) => i) : [0, xLabels.length - 1]),
  );
  const yTickFormatter = part.yTickFormatter ?? defaultBandLabel;

  const data: TileColumnRow[] = rows.map((row, col) => {
    const value = Number(row[valueKey] ?? 0);
    const tiles = tilesForValue(value, bands);
    const colors = Array.from({ length: Math.max(tiles, 1) }, (_, tile) =>
      stepColor(ctx, part, Math.min(tile, stepCount - 1), stepCount),
    );
    return {
      name: xLabels[col] ?? String(row[categoryKey] ?? col),
      value,
      tiles,
      colors,
      [NQ_SERIES_KEY]: part.dataKey,
      [NQ_DATUM]: row,
    };
  });

  const focusOn = isHoverFocusOn(ctx);
  const series = {
    type: "custom" as const,
    id: part.dataKey,
    coordinateSystem: "cartesian2d" as const,
    clip: true,
    ...hoverFocusOrOff(isHoverFocusOn(ctx), itemFocus({ family: "tileColumn" })),
    blur: {
      itemStyle: { opacity: HOVER_DIM_OPACITY },
    },
    ...focusTiming("tileColumn"),
    data,
    renderItem(params: Parameters<NonNullable<CustomSeriesOption["renderItem"]>>[0], api: Parameters<NonNullable<CustomSeriesOption["renderItem"]>>[1]) {
      const idx = params.dataIndex;
      if (idx < 0 || idx >= data.length) return;
      const datum = data[idx]!;
      const filled = datum.tiles;
      if (filled <= 0) return { type: "group" as const, children: [] };

      // Uniform squares: size from column width vs one band height. Never
      // stretch tiles to fill the band — value is encoded by tile COUNT, not
      // aspect. Each filled band is packed with as many squares as fit, evenly
      // pitched, so a column's top meets the y tick it stands for. Stacking
      // one square per band by its own size instead left tall-band columns far
      // below their labels (90 narrow days on a $0–$4K axis read as ~$300).
      // Square bands (bandH ≈ side + gap) still draw one tile per band.
      const floor = api.coord([idx, 0]);
      const oneBand = api.coord([idx, 1]);
      if (!floor || !oneBand) return { type: "group" as const, children: [] };
      const bandW = bandWidthAt(api, idx, 0);
      const floorX = floor[0] ?? 0;
      const floorY = floor[1] ?? 0;
      const bandH = Math.max(0, floorY - (oneBand[1] ?? 0));
      const side = Math.max(0, Math.min(bandW - cellGap, bandH - cellGap));
      if (side <= 0) return { type: "group" as const, children: [] };

      const children: Array<{
        type: "rect";
        shape: { x: number; y: number; width: number; height: number; r: number };
        style: ReturnType<CustomSeriesRenderItemAPI["style"]>;
        z2: number;
      } & ReturnType<typeof customFocusChild>> = [];
      const perBand = Math.max(1, Math.floor((bandH + 0.5) / (side + cellGap)));
      const pitch = bandH / perBand;
      const x = floorX - side / 2;
      for (let tile = 0; tile < filled; tile += 1) {
        const bandTop = floorY - (tile + 1) * bandH;
        for (let cell = 0; cell < perBand; cell += 1) {
          const y = bandTop + (pitch - side) / 2 + cell * pitch;
          children.push({
            type: "rect",
            shape: {
              x,
              y,
              width: side,
              height: side,
              r: Math.min(cellRadius, side / 2),
            },
            style: api.style({
              fill: datum.colors[Math.min(tile, datum.colors.length - 1)],
              stroke: "transparent",
              lineWidth: 0,
            }),
            z2: 1,
            ...customFocusChild(focusOn),
          });
        }
      }
      return { type: "group" as const, ...customFocusGroup(focusOn), children };
    },
  } as CustomSeriesOption;

  const base: EChartsOption = {
    tooltip: {
      trigger: "item",
      formatter: (raw) => {
        const params = Array.isArray(raw) ? raw[0] : raw;
        const row = (params as { data?: TileColumnRow })?.data;
        if (!row) return "";
        return `${row.name}<br/>${row.value}`;
      },
    },
    legend: { show: false },
    grid: resolveCartesianGrid(ctx.parts, ctx.cartesian?.externalBrush, gridBottomWithZoom(false)),
    xAxis: {
      type: "category",
      data: xLabels,
      boundaryGap: true,
      axisTick: { show: false },
      axisLine: { show: false },
      splitLine: { show: false },
      axisLabel: {
        ...CHART_TYPOGRAPHY.axis,
        interval: 0,
        formatter: (_value: string, index: number) =>
          labelIndices.has(index) ? xLabels[index]! : "",
      },
    },
    yAxis: {
      type: "value",
      min: 0,
      max: bandRows,
      interval: 1,
      axisTick: { show: false },
      axisLine: { show: false },
      splitLine: { show: false },
      axisLabel: {
        ...CHART_TYPOGRAPHY.axis,
        formatter: (value: number) => {
          if (!Number.isInteger(value)) return "";
          if (value < 0 || value > bandRows) return "";
          // Label every band edge when bands were provided; otherwise ends only.
          if (part.bands) {
            const band = bands[value];
            return band == null ? "" : yTickFormatter(band);
          }
          if (value === 0 || value === bandRows) {
            const band = bands[value] ?? 0;
            return yTickFormatter(band);
          }
          return "";
        },
      },
    },
    series: [series],
  };

  return applyChartUiToOption(ctx, base);
}
