import type { CustomSeriesOption, EChartsOption } from "echarts";
import { applyChartUiToOption } from "./apply-chart-ui";
import { funnelFocus, itemFocus, HOVER_DIM_OPACITY } from "./emphasis-presets";
import { resolveFunnelLayout } from "./funnel-layout";
import { buildPipeLayout } from "./funnel-pipe-geometry";
import {
  resolveCanvasGapColor,
  resolveCanvasTileLabelColor,
} from "./resolve-chart-chrome";
import type {
  CompileContext,
  FunnelOrient,
  FunnelPart,
  FunnelStylePart,
} from "./parts/types";
import { CHART_TYPOGRAPHY } from "./chart-typography-tokens";

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

function compilePipeSeries(
  ctx: CompileContext,
  turnRadius: number | undefined,
  showLabels: boolean,
  orient: FunnelOrient,
): CustomSeriesOption {
  const funnel = ctx.parts.find((p): p is FunnelPart => p.type === "funnel");
  const stageKey = funnel?.stageKey ?? ctx.funnel?.stageKey ?? "stage";
  const valueKey = funnel?.valueKey ?? ctx.funnel?.valueKey ?? "value";
  const labelColor = resolveCanvasTileLabelColor(ctx.chartId);
  const horizontal = orient === "horizontal";
  const labelBand = showLabels
    ? horizontal
      ? PIPE_LABEL_BAND_H
      : PIPE_LABEL_BAND_V
    : PIPE_PAD;

  const data: PipeDatum[] = ctx.data.map((row) => {
    const key = String(row[stageKey] ?? "");
    return {
      name: ctx.config[key]?.label?.toString() ?? key,
      value: Number(row[valueKey] ?? 0),
      itemStyle: { color: ctx.resolveColor(key, 0) },
    };
  });

  return {
    type: "custom",
    id: "nq-funnel-pipe",
    coordinateSystem: "cartesian2d",
    clip: false,
    ...itemFocus({ dimLabel: true }),
    blur: {
      itemStyle: { opacity: HOVER_DIM_OPACITY },
    },
    stateAnimation: { duration: 0 },
    animationDurationUpdate: 0,
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
        },
      ];

      if (showLabels) {
        const mid = idx * layout.stageSpan + layout.stageSpan / 2;
        // Vertical: right-align in the left band so long names grow toward
        // the canvas edge from the ribbon (center-in-44px clipped "Application").
        const labelX = horizontal ? padL + mid : padL - PIPE_LABEL_GAP;
        const labelY = horizontal ? padT / 2 : padT + mid;
        children.push({
          type: "text",
          silent: true,
          style: {
            text: `${data[idx]!.name}\n${data[idx]!.value}`,
            fill: labelColor,
            ...CHART_TYPOGRAPHY.markLabel,
            textAlign: horizontal ? "center" : "right",
            textVerticalAlign: "middle",
          },
          x: labelX,
          y: labelY,
          z2: 2,
        });
      }

      return { type: "group", children };
    },
  } as CustomSeriesOption;
}

export function compileFunnelOption(ctx: CompileContext): EChartsOption {
  const funnel = ctx.parts.find((p): p is FunnelPart => p.type === "funnel");
  const style = ctx.parts.find((p): p is FunnelStylePart => p.type === "funnelStyle");
  const stageKey = funnel?.stageKey ?? ctx.funnel?.stageKey ?? "stage";
  const valueKey = funnel?.valueKey ?? ctx.funnel?.valueKey ?? "value";
  const { gap, borderWidth, minSize, orient, isPipe, turnRadius, showLabels } =
    resolveFunnelLayout(ctx, style);

  if (isPipe) {
    const base: EChartsOption = {
      ...pipeCartesianScaffold(),
      tooltip: { trigger: "item" },
      legend: { show: false },
      series: [compilePipeSeries(ctx, turnRadius, showLabels, orient)],
    };
    return applyChartUiToOption(ctx, base);
  }

  const gapColor = resolveCanvasGapColor(ctx.chartId);
  const insideLabelColor = resolveCanvasTileLabelColor(ctx.chartId);

  const funnelData = ctx.data.map((row) => {
    const key = String(row[stageKey] ?? "");
    const color = ctx.resolveColor(key, 0);
    return {
      name: ctx.config[key]?.label?.toString() ?? key,
      value: Number(row[valueKey] ?? 0),
      itemStyle: {
        color,
        borderColor: gapColor,
        borderWidth,
      },
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
        sort: "descending",
        gap,
        orient,
        funnelAlign: "center",
        itemStyle: {
          borderWidth,
          borderColor: gapColor,
        },
        label: {
          show: true,
          position: "inside",
          color: insideLabelColor,
          ...CHART_TYPOGRAPHY.markLabel,
          lineHeight: 16,
          formatter: "{b}\n{c}",
        },
        labelLine: { show: false },
        ...funnelFocus(),
        data: funnelData,
      },
    ],
  };

  return applyChartUiToOption(ctx, base);
}
