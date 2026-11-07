import type { CustomSeriesOption, EChartsOption } from "echarts";
import { applyChartUiToOption } from "./apply-chart-ui";
import {
  customFocusChild,
  customFocusGroup,
  funnelFocus,
  focusTiming,
  itemFocus,
  HOVER_DIM_OPACITY,
  hoverFocusOrOff,
  isHoverFocusOn,
} from "./emphasis-presets";
import { resolveFunnelLayout } from "./funnel-layout";
import { buildPipeLayout } from "./funnel-pipe-geometry";
import { buildConeFunnelLayout } from "./funnel-cone-geometry";
import { buildRoundedFunnelLayout } from "./funnel-rounded-geometry";
import {
  resolveCanvasGapColor,
  resolveCanvasTileLabelColor,
} from "./resolve-chart-chrome";
import { NQ_DATUM, NQ_SERIES_KEY } from "./nq-mark-event";
import type {
  CompileContext,
  FunnelConeStyle,
  FunnelLabel,
  FunnelOrient,
  FunnelPart,
  FunnelSort,
  FunnelStylePart,
} from "./parts/types";
import { CHART_TYPOGRAPHY } from "./chart-typography-tokens";

function resolveFunnelLabel(ctx: CompileContext): FunnelLabel {
  return ctx.funnel?.label ?? "name-value";
}

function formatFunnelLabelText(
  label: FunnelLabel,
  name: string,
  displayValue: number,
  formatValue?: (value: number) => string,
): string {
  const valueText = formatValue ? formatValue(displayValue) : String(displayValue);
  return label === "value" ? valueText : `${name}\n${valueText}`;
}

/** Top band for horizontal pipe labels (name + value, two lines). */
const PIPE_LABEL_BAND_H = 40;
/**
 * Left band for vertical pipe labels. Must fit longest stage names at
 * markLabel size with right-align — 44px centered clipped "Application".
 */
const PIPE_LABEL_BAND_V = 100;
/** Gap between label text and the ribbon edge. */
const PIPE_LABEL_GAP = 8;
const PIPE_PAD = 8;

type PipeDatum = {
  name: string;
  value: number;
  itemStyle: { color: string };
  [NQ_SERIES_KEY]: string;
  [NQ_DATUM]: Record<string, unknown>;
};

/**
 * Custom series defaults to cartesian2d and will not paint without a grid.
 * Axes stay hidden — layout uses pixel getWidth/getHeight, not api.coord.
 */
function pipeCartesianScaffold(): Pick<EChartsOption, "grid" | "xAxis" | "yAxis"> {
  return {
    grid: { left: 0, right: 0, top: 0, bottom: 0, containLabel: false },
    xAxis: { type: "value", show: false, min: 0, max: 1 },
    yAxis: { type: "value", show: false, min: 0, max: 1 },
  };
}

/** Match native funnel chrome insets (left 6% / width 88% / top·bottom 10). */
const ROUNDED_PAD_X_RATIO = 0.06;
const ROUNDED_PAD_Y = 10;

function parseMinSizeRatio(minSize: string): number {
  const m = /^(\d+(?:\.\d+)?)%$/.exec(minSize.trim());
  if (!m) return 0.12;
  return Math.min(1, Math.max(0, Number(m[1]) / 100));
}

function sortFunnelRows<T extends { value: number }>(
  rows: T[],
  sort: FunnelSort,
): T[] {
  if (sort === "none") return rows;
  const copy = rows.slice();
  copy.sort((a, b) =>
    sort === "ascending" ? a.value - b.value : b.value - a.value,
  );
  return copy;
}

function compilePipeSeries(
  ctx: CompileContext,
  turnRadius: number | undefined,
  showLabels: boolean,
  orient: FunnelOrient,
): CustomSeriesOption {
  const focusOn = isHoverFocusOn(ctx);
  const funnel = ctx.parts.find((p): p is FunnelPart => p.type === "funnel");
  const stageKey = funnel?.stageKey ?? ctx.funnel?.stageKey ?? "stage";
  const valueKey = funnel?.valueKey ?? ctx.funnel?.valueKey ?? "value";
  const sizeKey = ctx.funnel?.sizeKey;
  const labelFormat = resolveFunnelLabel(ctx);
  const formatValue = ctx.funnel?.formatValue;
  const labelColor = resolveCanvasTileLabelColor(ctx.chartId);
  const horizontal = orient === "horizontal";
  const labelBand = showLabels
    ? horizontal
      ? PIPE_LABEL_BAND_H
      : PIPE_LABEL_BAND_V
    : PIPE_PAD;

  const data: PipeDatum[] = ctx.data.map((row) => {
    const key = String(row[stageKey] ?? "");
    const displayValue = Number(row[valueKey] ?? 0);
    const sizeValue = sizeKey != null ? Number(row[sizeKey] ?? 0) : displayValue;
    return {
      name: ctx.config[key]?.label?.toString() ?? key,
      value: sizeValue,
      itemStyle: { color: ctx.resolveColor(key, 0) },
      [NQ_SERIES_KEY]: key,
      [NQ_DATUM]: { ...row, __nq_displayValue: displayValue },
    };
  });

  return {
    type: "custom",
    id: "nq-funnel-pipe",
    coordinateSystem: "cartesian2d",
    clip: false,
    ...hoverFocusOrOff(isHoverFocusOn(ctx), itemFocus({ dimLabel: true })),
    blur: {
      itemStyle: { opacity: HOVER_DIM_OPACITY },
    },
    ...focusTiming("funnel"),
    data,
    renderItem(params, api) {
      const idx = params.dataIndex;
      if (idx < 0 || idx >= data.length) return;

      const chartW = api.getWidth();
      const chartH = api.getHeight();
      if (chartW <= 0 || chartH <= 0) return;

      // Horizontal: labels above → pad top. Vertical: labels left → pad left.
      const padL = horizontal ? PIPE_PAD : labelBand;
      const padT = horizontal ? labelBand : PIPE_PAD;
      const padR = PIPE_PAD;
      const padB = PIPE_PAD;

      const width = Math.max(chartW - padL - padR, 1);
      const height = Math.max(chartH - padT - padB, 1);
      const layout = buildPipeLayout(
        data.map((d) => ({ value: d.value })),
        { width, height, turnRadius, orient },
      );
      const stagePath = layout.stagePaths[idx];
      if (!stagePath) return;

      const color = data[idx]!.itemStyle.color;
      const children: Record<string, unknown>[] = [
        {
          type: "path",
          x: padL,
          y: padT,
          shape: { pathData: stagePath },
          style: api.style({ fill: color, stroke: color, lineWidth: 0 }),
          z2: 1,
          ...customFocusChild(focusOn),
        },
      ];

      if (showLabels) {
        const mid = idx * layout.stageSpan + layout.stageSpan / 2;
        // Vertical: right-align in the left band so long names grow toward
        // the canvas edge from the ribbon (center-in-44px clipped "Application").
        const labelX = horizontal ? padL + mid : padL - PIPE_LABEL_GAP;
        const labelY = horizontal ? padT / 2 : padT + mid;
        const displayValue = Number(
          (data[idx]![NQ_DATUM] as Record<string, unknown>).__nq_displayValue ??
            data[idx]!.value,
        );
        children.push({
          type: "text",
          silent: true,
          style: {
            text: formatFunnelLabelText(
              labelFormat,
              data[idx]!.name,
              displayValue,
              formatValue,
            ),
            fill: labelColor,
            ...CHART_TYPOGRAPHY.markLabel,
            textAlign: horizontal ? "center" : "right",
            textVerticalAlign: "middle",
          },
          x: labelX,
          y: labelY,
          z2: 2,
          ...customFocusChild(focusOn),
        });
      }

      return { type: "group", ...customFocusGroup(focusOn), children };
    },
  } as CustomSeriesOption;
}

type RoundedDatum = {
  name: string;
  value: number;
  itemStyle: { color: string };
  [NQ_SERIES_KEY]: string;
  [NQ_DATUM]: Record<string, unknown>;
};

/** Stage rows for the custom (rounded / cone) series, in display order. */
function buildStageData(ctx: CompileContext, sort: FunnelSort): RoundedDatum[] {
  const funnel = ctx.parts.find((p): p is FunnelPart => p.type === "funnel");
  const stageKey = funnel?.stageKey ?? ctx.funnel?.stageKey ?? "stage";
  const valueKey = funnel?.valueKey ?? ctx.funnel?.valueKey ?? "value";
  const sizeKey = ctx.funnel?.sizeKey;
  const unsorted: RoundedDatum[] = ctx.data.map((row) => {
    const key = String(row[stageKey] ?? "");
    const displayValue = Number(row[valueKey] ?? 0);
    const sizeValue = sizeKey != null ? Number(row[sizeKey] ?? 0) : displayValue;
    return {
      name: ctx.config[key]?.label?.toString() ?? key,
      value: sizeValue,
      itemStyle: { color: ctx.resolveColor(key, 0) },
      [NQ_SERIES_KEY]: key,
      [NQ_DATUM]: { ...row, __nq_displayValue: displayValue },
    };
  });
  return sortFunnelRows(unsorted, sort);
}

/** Inside-label text for one custom-series stage. */
function stageLabelText(ctx: CompileContext, d: RoundedDatum): string {
  const displayValue = Number(
    (d[NQ_DATUM] as Record<string, unknown>).__nq_displayValue ?? d.value,
  );
  return formatFunnelLabelText(
    resolveFunnelLabel(ctx),
    d.name,
    displayValue,
    ctx.funnel?.formatValue,
  );
}

/** renderItem runs once per stage; build the layout once per plot size. */
function memoBySize<T>(build: (width: number, height: number) => T) {
  let cached: { key: string; value: T } | null = null;
  return (width: number, height: number): T => {
    const key = `${width}x${height}`;
    if (cached?.key !== key) cached = { key, value: build(width, height) };
    return cached.value;
  };
}

/** Plot box inside the canvas for custom funnel series (matches native insets). */
function customPlotBox(chartW: number, chartH: number) {
  const padL = chartW * ROUNDED_PAD_X_RATIO;
  return {
    padL,
    padT: ROUNDED_PAD_Y,
    width: Math.max(chartW - 2 * padL, 1),
    height: Math.max(chartH - 2 * ROUNDED_PAD_Y, 1),
  };
}

function compileRoundedSeries(
  ctx: CompileContext,
  gap: number,
  cornerRadius: number,
  sideCurve: number,
  rimDepth: number,
  innerCornerRadius: number,
  minSize: string,
  showLabels: boolean,
  sort: FunnelSort,
): CustomSeriesOption {
  const focusOn = isHoverFocusOn(ctx);
  const labelColor = resolveCanvasTileLabelColor(ctx.chartId);
  const minSizeRatio = parseMinSizeRatio(minSize);
  const data = buildStageData(ctx, sort);
  const stageInputs = data.map((d) => ({ value: d.value }));
  const layoutFor = memoBySize((width, height) =>
    buildRoundedFunnelLayout(stageInputs, {
      width,
      height,
      gap,
      cornerRadius,
      sideCurve,
      rimDepth,
      innerCornerRadius,
      minSizeRatio,
    }),
  );

  return {
    type: "custom",
    id: "nq-funnel-rounded",
    coordinateSystem: "cartesian2d",
    clip: false,
    ...hoverFocusOrOff(isHoverFocusOn(ctx), itemFocus({ dimLabel: true })),
    blur: {
      itemStyle: { opacity: HOVER_DIM_OPACITY },
    },
    ...focusTiming("funnel"),
    data,
    renderItem(params, api) {
      const idx = params.dataIndex;
      if (idx < 0 || idx >= data.length) return;

      const chartW = api.getWidth();
      const chartH = api.getHeight();
      if (chartW <= 0 || chartH <= 0) return;

      const { padL, padT, width, height } = customPlotBox(chartW, chartH);
      const layout = layoutFor(width, height);
      const stagePath = layout.stagePaths[idx];
      const labelAt = layout.labelCenters[idx];
      if (!stagePath || !labelAt) return;

      const color = data[idx]!.itemStyle.color;
      const children: Record<string, unknown>[] = [
        {
          type: "path",
          x: padL,
          y: padT,
          shape: { pathData: stagePath },
          style: api.style({ fill: color, stroke: color, lineWidth: 0 }),
          z2: 1,
          ...customFocusChild(focusOn),
        },
      ];

      if (showLabels) {
        children.push({
          type: "text",
          silent: true,
          style: {
            text: stageLabelText(ctx, data[idx]!),
            fill: labelColor,
            ...CHART_TYPOGRAPHY.markLabel,
            textAlign: "center",
            textVerticalAlign: "middle",
          },
          x: padL + labelAt.x,
          y: padT + labelAt.y,
          z2: 2,
          ...customFocusChild(focusOn),
        });
      }

      return { type: "group", ...customFocusGroup(focusOn), children };
    },
  } as CustomSeriesOption;
}

/**
 * Cone shading overlays. Translucent black/white over the stage's own color, so
 * any color format (hex, rgb, oklch, CSS var resolved by ECharts) shades alike.
 */
const CONE_BODY_SHADE = {
  type: "linear",
  x: 0,
  y: 0,
  x2: 1,
  y2: 0,
  colorStops: [
    { offset: 0, color: "rgba(0,0,0,0.38)" },
    { offset: 0.32, color: "rgba(255,255,255,0.2)" },
    { offset: 0.6, color: "rgba(255,255,255,0)" },
    { offset: 1, color: "rgba(0,0,0,0.45)" },
  ],
} as const;
const CONE_CAP_LIT = {
  type: "linear",
  x: 0,
  y: 0,
  x2: 1,
  y2: 1,
  colorStops: [
    { offset: 0, color: "rgba(255,255,255,0.38)" },
    { offset: 1, color: "rgba(255,255,255,0.1)" },
  ],
} as const;
const CONE_CAP_OPENING = {
  type: "linear",
  x: 0,
  y: 0,
  x2: 0,
  y2: 1,
  colorStops: [
    { offset: 0, color: "rgba(0,0,0,0.62)" },
    { offset: 1, color: "rgba(0,0,0,0.25)" },
  ],
} as const;
const CONE_RIM_STROKE = "rgba(255,255,255,0.35)";

function compileConeSeries(
  ctx: CompileContext,
  gap: number,
  tilt: number,
  coneStyle: FunnelConeStyle,
  minSize: string,
  showLabels: boolean,
  sort: FunnelSort,
): CustomSeriesOption {
  const labelColor = resolveCanvasTileLabelColor(ctx.chartId);
  const minSizeRatio = parseMinSizeRatio(minSize);
  const data = buildStageData(ctx, sort);
  const stageInputs = data.map((d) => ({ value: d.value }));
  const layoutFor = memoBySize((width, height) =>
    buildConeFunnelLayout(stageInputs, { width, height, gap, tilt, minSizeRatio }),
  );
  const hoverOn = isHoverFocusOn(ctx);
  // Custom series: focus lives on the returned element, states on each child.
  const dim = customFocusChild(hoverOn);

  return {
    type: "custom",
    id: "nq-funnel-cone",
    coordinateSystem: "cartesian2d",
    clip: false,
    ...hoverFocusOrOff(hoverOn, itemFocus({ dimLabel: true })),
    blur: {
      itemStyle: { opacity: HOVER_DIM_OPACITY },
    },
    ...focusTiming("funnel"),
    data,
    renderItem(params, api) {
      const idx = params.dataIndex;
      if (idx < 0 || idx >= data.length) return;
      const chartW = api.getWidth();
      const chartH = api.getHeight();
      if (chartW <= 0 || chartH <= 0) return;

      const { padL, padT, width, height } = customPlotBox(chartW, chartH);
      const stage = layoutFor(width, height).stages[idx];
      if (!stage) return;

      const color = data[idx]!.itemStyle.color;
      const opening = coneStyle === "hollow" && idx === 0;
      // Upper slices paint over lower ones so each hides the back of the cap below.
      const z = (data.length - idx) * 10;
      const at = { x: padL, y: padT };
      const children: Record<string, unknown>[] = [
        { type: "path", ...at, shape: { pathData: stage.bodyPath }, style: { fill: color }, z2: z, ...dim },
        { type: "path", ...at, silent: true, shape: { pathData: stage.bodyPath }, style: { fill: CONE_BODY_SHADE }, z2: z + 1, ...dim },
        { type: "path", ...at, shape: { pathData: stage.capPath }, style: { fill: color }, z2: z + 2, ...dim },
        {
          type: "path",
          ...at,
          silent: true,
          shape: { pathData: stage.capPath },
          style: opening
            ? { fill: CONE_CAP_OPENING, stroke: CONE_RIM_STROKE, lineWidth: 1.5 }
            : { fill: CONE_CAP_LIT },
          z2: z + 3,
          ...dim,
        },
      ];

      if (showLabels) {
        children.push({
          type: "text",
          silent: true,
          style: {
            text: stageLabelText(ctx, data[idx]!),
            fill: labelColor,
            ...CHART_TYPOGRAPHY.markLabel,
            textAlign: "center",
            textVerticalAlign: "middle",
          },
          x: padL + stage.labelCenter.x,
          y: padT + stage.labelCenter.y,
          z2: z + 4,
          ...dim,
        });
      }

      return { type: "group", ...customFocusGroup(hoverOn), children };
    },
  } as CustomSeriesOption;
}

export function compileFunnelOption(ctx: CompileContext): EChartsOption {
  const funnel = ctx.parts.find((p): p is FunnelPart => p.type === "funnel");
  const style = ctx.parts.find((p): p is FunnelStylePart => p.type === "funnelStyle");
  const stageKey = funnel?.stageKey ?? ctx.funnel?.stageKey ?? "stage";
  const valueKey = funnel?.valueKey ?? ctx.funnel?.valueKey ?? "value";
  const {
    gap,
    borderWidth,
    minSize,
    orient,
    sort,
    isPipe,
    isRounded,
    isCone,
    coneTilt,
    coneStyle,
    turnRadius,
    showLabels,
    cornerRadius,
    sideCurve,
    rimDepth,
    innerCornerRadius,
  } = resolveFunnelLayout(ctx, style);

  if (isPipe) {
    const base: EChartsOption = {
      ...pipeCartesianScaffold(),
      tooltip: { trigger: "item" },
      legend: { show: false },
      series: [compilePipeSeries(ctx, turnRadius, showLabels, orient)],
    };
    return applyChartUiToOption(ctx, base);
  }

  if (isCone) {
    const base: EChartsOption = {
      ...pipeCartesianScaffold(),
      tooltip: { trigger: "item" },
      legend: { show: false },
      series: [
        compileConeSeries(ctx, gap, coneTilt, coneStyle, minSize, showLabels, sort),
      ],
    };
    return applyChartUiToOption(ctx, base);
  }

  if (isRounded) {
    const base: EChartsOption = {
      ...pipeCartesianScaffold(),
      tooltip: { trigger: "item" },
      legend: { show: false },
      series: [
        compileRoundedSeries(
          ctx,
          gap,
          cornerRadius,
          sideCurve,
          rimDepth,
          innerCornerRadius,
          minSize,
          showLabels,
          sort,
        ),
      ],
    };
    return applyChartUiToOption(ctx, base);
  }

  const gapColor = resolveCanvasGapColor(ctx.chartId);
  const insideLabelColor = resolveCanvasTileLabelColor(ctx.chartId);
  const sizeKey = ctx.funnel?.sizeKey;
  const labelFormat = resolveFunnelLabel(ctx);
  const formatValue = ctx.funnel?.formatValue;

  const funnelData = ctx.data.map((row) => {
    const key = String(row[stageKey] ?? "");
    const color = ctx.resolveColor(key, 0);
    const displayValue = Number(row[valueKey] ?? 0);
    const sizeValue = sizeKey != null ? Number(row[sizeKey] ?? 0) : displayValue;
    return {
      name: ctx.config[key]?.label?.toString() ?? key,
      value: sizeValue,
      itemStyle: {
        color,
        borderColor: gapColor,
        borderWidth,
        borderRadius: cornerRadius,
      },
      [NQ_SERIES_KEY]: key,
      [NQ_DATUM]: { ...row, __nq_displayValue: displayValue },
    };
  });

  const base: EChartsOption = {
    tooltip: { trigger: "item" },
    legend: { show: false },
    series: [
      {
        type: "funnel",
        left: "6%",
        top: 10,
        bottom: 10,
        width: "88%",
        minSize,
        maxSize: "100%",
        sort,
        gap,
        orient,
        funnelAlign: "center",
        itemStyle: {
          borderWidth,
          borderColor: gapColor,
          borderRadius: cornerRadius,
        },
        label: {
          show: showLabels,
          position: "inside",
          color: insideLabelColor,
          ...CHART_TYPOGRAPHY.markLabel,
          lineHeight: 16,
          formatter: (params: unknown) => {
            const p = params as {
              name?: string;
              data?: Record<string, unknown>;
            };
            const embedded = p.data?.[NQ_DATUM] as Record<string, unknown> | undefined;
            const display = Number(
              embedded?.__nq_displayValue ?? p.data?.value ?? 0,
            );
            return formatFunnelLabelText(
              labelFormat,
              String(p.name ?? ""),
              display,
              formatValue,
            );
          },
        },
        labelLine: { show: false },
        ...hoverFocusOrOff(isHoverFocusOn(ctx), funnelFocus()),
        data: funnelData,
      },
    ],
  };

  return applyChartUiToOption(ctx, base);
}
