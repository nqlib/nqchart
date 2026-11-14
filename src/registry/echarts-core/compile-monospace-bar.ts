import type { CustomSeriesOption, CustomSeriesRenderItemAPI, CustomSeriesRenderItemParams } from "echarts";
import { NQ_MONOSPACE_SERIES_ID, CHART_ANIMATION } from "./chart-animation-tokens";
import { resolveBarRadius, signedBarBorderRadius } from "./bar-radius";
import { clampRadius } from "./chart-signature";
import { CHART_FONT_FAMILY_MONO, CHART_FONT_SIZE, CHART_FONT_WEIGHT } from "./chart-typography-tokens";
import type { BarSeriesPart, CompileContext } from "./parts/types";

/** [categoryIndex, value, foldScale, showLabel] */
export type MonospaceDataRow = [number, number, number, 0 | 1];

function bandWidthAt(
  api: CustomSeriesRenderItemAPI,
  category: string | number,
  value: number,
) {
  const sizeResult = api.size?.([1, 0], [category, value]);
  if (Array.isArray(sizeResult)) return sizeResult[0] ?? 0;
  return Number(sizeResult ?? 0);
}

function renderMonospaceBarItem(
  params: CustomSeriesRenderItemParams,
  api: CustomSeriesRenderItemAPI,
  color: string,
  categories: string[],
  radius: number,
) {
  const categoryIndex = params.dataIndex;
  const category = categories[categoryIndex];
  if (category == null) return;

  const value = api.value(1) as number;
  const { collapsedScale, expandedBandRatio } = CHART_ANIMATION.monospace;
  const foldScale = Number(api.value(2) ?? collapsedScale);
  const showLabel = api.value(3) === 1;
  if (value == null || Number.isNaN(value)) return;

  const bandWidth = bandWidthAt(api, category, value);
  if (bandWidth <= 0) return;

  const fullWidth = bandWidth * expandedBandRatio;
  const top = api.coord([category, value]);
  const base = api.coord([category, 0]);
  const centerX = top[0] ?? 0;
  const topY = top[1] ?? 0;
  const baseY = base[1] ?? 0;
  const y = Math.min(topY, baseY);
  const height = Math.abs(baseY - topY);
  const visualWidth = fullWidth * foldScale;
  const barX = centerX - visualWidth / 2;
  const hitX = centerX - bandWidth / 2;

  return {
    type: "group" as const,
    id: `nq-ms-group-${categoryIndex}`,
    children: [
      {
        type: "rect",
        id: `nq-ms-hit-${categoryIndex}`,
        shape: { x: hitX, y, width: bandWidth, height },
        style: { fill: "transparent" },
        z2: 0,
      },
      {
        type: "rect",
        id: `nq-ms-bar-${categoryIndex}`,
        shape: { x: barX, y, width: visualWidth, height, r: signedBarBorderRadius(value, clampRadius(radius, Math.min(visualWidth, height)), false) },
        style: api.style({ fill: color }),
        silent: true,
        z2: 1,
      },
      {
        type: "text",
        id: `nq-ms-label-${categoryIndex}`,
        silent: true,
        style: {
          text: String(value),
          fill: color,
          font: `${CHART_FONT_WEIGHT.normal} ${CHART_FONT_SIZE.small}px ${CHART_FONT_FAMILY_MONO}`,
          textAlign: "center",
          textVerticalAlign: "bottom",
          opacity: showLabel ? 1 : 0,
        },
        x: centerX,
        y: showLabel ? y - 6 : y - 2,
        z2: 2,
      },
    ],
  };
}

export function buildMonospaceCustomSeries(
  bar: BarSeriesPart,
  ctx: CompileContext,
  rows: Record<string, unknown>[],
): CustomSeriesOption {
  const color = ctx.resolveColor(bar.dataKey, 0);
  const radius = resolveBarRadius(bar.radius, ctx.cartesian?.barRadius, ctx.chartId);
  const xKey =
    ctx.xDataKey ??
    ctx.parts.find((p) => p.type === "xAxis")?.dataKey ??
    Object.keys(rows[0] ?? {})[0] ??
    "category";
  const categories = rows.map((row) => String(row[xKey] ?? ""));

  const data: MonospaceDataRow[] = rows.map((row, index) => [
    index,
    Number(row[bar.dataKey] ?? 0),
    1,
    0,
  ]);

  return {
    type: "custom",
    id: NQ_MONOSPACE_SERIES_ID,
    name: ctx.config[bar.dataKey]?.label?.toString() ?? bar.dataKey,
    nqMonospace: true,
    // The value sits above the bar. Clipping to the grid cuts the tallest label.
    clip: false,
    coordinateSystem: "cartesian2d",
    dimensions: ["x", "value", "foldScale", "showLabel"],
    data,
    encode: { x: 0, y: 1 },
    renderItem(params, api) {
      return renderMonospaceBarItem(params, api, color, categories, radius);
    },
  } as CustomSeriesOption;
}

export function buildMonospaceFoldRow(
  index: number,
  value: number,
  foldScale: number,
  showLabel: boolean,
): MonospaceDataRow {
  return [index, value, foldScale, showLabel ? 1 : 0];
}
