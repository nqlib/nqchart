/**
 * Pure server-safe pie compiler — maps parts + data to an ECharts option.
 * Never touches `document`, React hooks, or browser APIs.
 *
 * Every pie — plain, donut, rose — is one custom series drawn with the
 * signature geometry (`pie-sector-geometry.ts`): an even seam between slices
 * and round corners. ECharts' native `pie` cannot do this: its `padAngle`
 * opens wedge-shaped gaps that widen toward the rim.
 */
import type { CustomSeriesOption, EChartsOption } from "echarts";
import { applyChartUiToOption } from "./apply-chart-ui";
import { CIRCULAR_LABELED_OUTER_RADIUS, resolveChartSignature } from "./chart-signature";
import {
  customFocusChild,
  customFocusGroup,
  focusTiming,
  HOVER_DIM_OPACITY,
  hoverFocusOrOff,
  isHoverFocusOn,
  itemFocus,
} from "./emphasis-presets";
import { NQ_DATUM, NQ_SERIES_KEY } from "./nq-mark-event";
import {
  buildPieSlices,
  layoutOutsideLabels,
  slicesBounds,
  type PieSlice,
  type SliceLabel,
} from "./pie-sector-geometry";
import { resolveCanvasChartChrome } from "./resolve-chart-chrome";
import type { CompileContext, PieSeriesPart, PieSort } from "./parts/types";
import { CHART_TYPOGRAPHY } from "./chart-typography-tokens";

/** Plain pie / donut defaults: room around the rim for leader-line labels. */
const PIE_DEFAULT_INNER = 0;
const PIE_DEFAULT_OUTER = CIRCULAR_LABELED_OUTER_RADIUS;
/** Rose defaults: small hub, nearly full-bleed rim (labels are off by default). */
const ROSE_DEFAULT_INNER = "12%";
const ROSE_DEFAULT_OUTER = "92%";
/** Slices narrower than this (radians, 3°) get no outside label; the tooltip names them. */
const MIN_LABEL_ANGLE = (3 * Math.PI) / 180;
/** Label row height for collision spreading (px). */
const LABEL_LINE_HEIGHT = 16;
/** Share of the canvas a fitted rose may fill. */
const ROSE_FIT = 0.94;

type PieDatum = {
  name: string;
  value: number;
  itemStyle: { color: string };
  [NQ_SERIES_KEY]: string;
  [NQ_DATUM]: Record<string, unknown>;
};

function buildPieData(ctx: CompileContext, pie: PieSeriesPart | undefined): PieDatum[] {
  const nameKey =
    pie?.nameKey ?? ctx.nameKey ?? Object.keys(ctx.data[0] ?? {})[0] ?? "name";
  const valueKey = pie?.dataKey ?? "value";
  return ctx.data.map((row) => {
    const seriesKey = String(row[nameKey] ?? "");
    return {
      name: ctx.config[seriesKey]?.label?.toString() ?? seriesKey,
      value: Number(row[valueKey] ?? row[seriesKey] ?? 0),
      itemStyle: { color: ctx.resolveColor(seriesKey, 0) },
      // Raw slice id + source row — display `name` may be a config label.
      [NQ_SERIES_KEY]: seriesKey,
      [NQ_DATUM]: row,
    };
  });
}

function sortRows(rows: PieDatum[], sort: PieSort): PieDatum[] {
  if (sort === "none") return rows;
  const copy = rows.slice();
  copy.sort((a, b) => (sort === "ascending" ? a.value - b.value : b.value - a.value));
  return copy;
}

/** `number` = px; `"NN%"` = percent of half the shorter canvas side. */
export function resolveRadiusPx(value: number | string, halfMin: number): number {
  if (typeof value === "number") return Math.max(0, value);
  const m = /^(-?[\d.]+)%$/.exec(value.trim());
  if (m?.[1]) return Math.max(0, (Number(m[1]) / 100) * halfMin);
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? Math.max(0, n) : 0;
}

type PieFrame = { slices: PieSlice[]; labels: Array<SliceLabel | null> };

function compilePieSeries(ctx: CompileContext, pie: PieSeriesPart | undefined): CustomSeriesOption {
  const rose = pie?.rose;
  const data = sortRows(buildPieData(ctx, pie), pie?.sort ?? (rose ? "descending" : "none"));
  const values = data.map((d) => d.value);
  const signature = resolveChartSignature(ctx.chartId);
  const gap = pie?.gap ?? signature.gap.seam;
  const cornerRadius = pie?.cornerRadius ?? signature.radius.surface;
  const showLabels = pie?.showLabels ?? !rose;
  const innerSpec = pie?.innerRadius ?? (rose ? ROSE_DEFAULT_INNER : PIE_DEFAULT_INNER);
  const outerSpec = pie?.outerRadius ?? (rose ? ROSE_DEFAULT_OUTER : PIE_DEFAULT_OUTER);
  const labelColor = resolveCanvasChartChrome(ctx.chartId).muted;
  const focusOn = isHoverFocusOn(ctx);
  // Custom series: focus lives on the returned element, states on each child.
  const states = customFocusChild(focusOn);

  let cached: { key: string; frame: PieFrame } | null = null;
  const frameFor = (w: number, h: number): PieFrame => {
    const key = `${w}x${h}`;
    if (cached?.key === key) return cached.frame;
    const halfMin = Math.min(w, h) / 2;
    const layout = (cx: number, cy: number, scale: number) => {
      const inner = resolveRadiusPx(innerSpec, halfMin) * scale;
      const outer = resolveRadiusPx(outerSpec, halfMin) * scale;
      return {
        inner,
        slices: buildPieSlices(values, {
          cx,
          cy,
          innerRadius: inner,
          outerRadius: outer,
          gap,
          cornerRadius,
          rose,
        }),
      };
    };
    let cx = w / 2;
    let cy = h / 2;
    let slices = layout(cx, cy, 1).slices;
    // A rose is lopsided (big slices on one side). Without an explicit radius
    // or outside labels, fit the drawn shape — not the circle — to the canvas.
    if (rose && pie?.outerRadius == null && !showLabels) {
      const probe = layout(0, 0, 1);
      const b = slicesBounds(probe.slices, 0, 0, probe.inner);
      const bw = b.maxX - b.minX;
      const bh = b.maxY - b.minY;
      if (bw > 0 && bh > 0) {
        const scale = Math.min((w * ROSE_FIT) / bw, (h * ROSE_FIT) / bh);
        cx = w / 2 - ((b.minX + b.maxX) / 2) * scale;
        cy = h / 2 - ((b.minY + b.maxY) / 2) * scale;
        slices = layout(cx, cy, scale).slices;
      }
    }
    const labels = showLabels
      ? layoutOutsideLabels(slices, cx, cy, {
          height: h,
          lineHeight: LABEL_LINE_HEIGHT,
          minAngle: MIN_LABEL_ANGLE,
        })
      : slices.map(() => null);
    const frame = { slices, labels };
    cached = { key, frame };
    return frame;
  };

  return {
    type: "custom",
    id: rose ? "nq-pie-rose" : "nq-pie",
    coordinateSystem: "none",
    ...hoverFocusOrOff(focusOn, itemFocus({ dimLabel: true, family: "pie" })),
    blur: { itemStyle: { opacity: HOVER_DIM_OPACITY } },
    ...focusTiming("pie"),
    data,
    renderItem(params, api) {
      const idx = params.dataIndex;
      const w = api.getWidth();
      const h = api.getHeight();
      if (idx < 0 || idx >= data.length || w <= 0 || h <= 0) return;
      const frame = frameFor(w, h);
      const slice = frame.slices[idx];
      if (!slice?.path) return;

      // Legend isolate dims through the item's `itemStyle.opacity`.
      const opacity = Number((api.style() as { opacity?: number }).opacity ?? 1);
      const children: Record<string, unknown>[] = [
        {
          type: "path",
          shape: { pathData: slice.path },
          style: { fill: data[idx]!.itemStyle.color, opacity },
          ...states,
        },
      ];
      const label = frame.labels[idx];
      if (label) {
        children.push(
          {
            type: "polyline",
            silent: true,
            shape: { points: label.line.map((p) => [p.x, p.y]) },
            style: { stroke: labelColor, lineWidth: 1, fill: "none", opacity },
            ...states,
          },
          {
            type: "text",
            silent: true,
            x: label.x,
            y: label.y,
            style: {
              text: data[idx]!.name,
              fill: labelColor,
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

export function compilePieOption(ctx: CompileContext): EChartsOption {
  const pie = ctx.parts.find((p): p is PieSeriesPart => p.type === "pie");
  return applyChartUiToOption(ctx, {
    tooltip: { trigger: "item" },
    series: [compilePieSeries(ctx, pie)],
  });
}
