import type { ChartConfig } from "@/registry/ui/chart";
import type { CustomSeriesOption, EChartsOption } from "echarts";
import { applyChartUiToOption } from "./apply-chart-ui";
import { barLayoutGaps } from "./bar-item-style";
import { resolveBarRadius, signedBarBorderRadius } from "./bar-radius";
import { waterfallColumnFocus, hoverFocusOrOff, isHoverFocusOn } from "./emphasis-presets";
import { resolveCartesianGrid, withValueLabelRoom } from "./chart-grid";
import { buildCategoryDataZoom, gridBottomWithZoom } from "./category-data-zoom";
import { CHART_TYPOGRAPHY } from "./chart-typography-tokens";
import { getColorsCount } from "./config-colors";
import { escapeHtml, formatValue, indicatorDot, tooltipShell } from "./echarts-tooltip";
import { NQ_DATUM, NQ_SERIES_KEY } from "./nq-mark-event";
import { isChartDark, resolveCanvasChartChrome } from "./resolve-chart-chrome";
import type { CompileContext, TooltipPart, WaterfallPart } from "./parts/types";
import {
  buildWaterfallSteps,
  withWaterfallDirectionConfig,
  type WaterfallStep,
} from "./waterfall-steps";

/** Matches `hover-focus-repair.ts`. */
const VALUES_ID = "__wf_values__";
const PLACEHOLDER_ID = "__wf_placeholder__";
const CONNECTORS_ID = "__wf_connectors__";
const MINUS = "−";

/** `+45` / `−15` for a step; the plain value for a start or total column. */
export function formatWaterfallDelta(step: WaterfallStep): string {
  const column = step.kind === "start" || step.kind === "total";
  const sign = step.delta < 0 ? MINUS : column ? "" : "+";
  return `${sign}${formatValue(Math.abs(step.delta))}`;
}

/** Share of a category band that one bar fills (`barCategoryGap: "28%"` → 0.72). */
function barFill(categoryGap: string): number {
  const m = /^([\d.]+)%$/.exec(categoryGap.trim());
  const gap = m?.[1] ? Number(m[1]) / 100 : 0.2;
  return Math.min(1, Math.max(0, 1 - gap));
}

/** Label at the moving end: above / below a column, right / left of a row. */
function labelPosition(step: WaterfallStep, horizontal: boolean): "top" | "bottom" | "left" | "right" {
  const up = step.kind === "start" || step.kind === "total" ? step.delta >= 0 : step.end >= step.start;
  if (horizontal) return up ? "right" : "left";
  return up ? "top" : "bottom";
}

/**
 * One silent custom series: a 1px line from the moving end of each column to
 * the next column, at the running total. It sits under the bars.
 */
function connectorSeries(
  steps: WaterfallStep[],
  horizontal: boolean,
  fill: number,
  color: string,
): CustomSeriesOption {
  const data = steps.slice(0, -1).map((s, i) => (horizontal ? [s.end, i] : [i, s.end]));
  return {
    type: "custom",
    id: CONNECTORS_ID,
    name: CONNECTORS_ID,
    coordinateSystem: "cartesian2d",
    silent: true,
    z: 1,
    animation: false,
    tooltip: { show: false },
    data,
    renderItem(params, api) {
      const i = params.dataIndex;
      const level = Number(api.value(horizontal ? 0 : 1));
      const here = api.coord(horizontal ? [level, i] : [i, level]);
      const next = api.coord(horizontal ? [level, i + 1] : [i + 1, level]);
      const band = (api.size?.(horizontal ? [0, 1] : [1, 0]) as number[] | undefined) ?? [0, 0];
      const half = (Math.abs(horizontal ? band[1]! : band[0]!) * fill) / 2;
      const [x1, y1, x2, y2] = horizontal
        ? [here[0]!, here[1]! + half, next[0]!, next[1]! - half]
        : [here[0]! + half, here[1]!, next[0]! - half, next[1]!];
      return {
        type: "line",
        silent: true,
        shape: { x1, y1, x2, y2 },
        style: { stroke: color, lineWidth: 1, opacity: 0.6 },
        // Hovering a column dims the other columns, never the step lines.
        blur: { style: { opacity: 0.6 } },
      };
    },
  };
}

/** Tooltip card: the signed step and the running total after it. */
function waterfallTooltipFormatter(
  steps: WaterfallStep[],
  names: string[],
  keys: string[],
  config: ChartConfig,
  tooltip: TooltipPart,
  chartId: string,
) {
  const dot = (key: string) => {
    const entry = config[key];
    return tooltip.hideIndicator ? "" : indicatorDot(key, entry != null, entry ? getColorsCount(entry) : 1);
  };
  const row = (key: string, label: string, value: string) =>
    `<div class="flex w-full items-center justify-between gap-4 leading-none">
      <span class="text-muted-foreground flex items-center">${key ? dot(key) : ""}${escapeHtml(label)}</span>
      <span class="font-mono font-medium tabular-nums">${escapeHtml(value)}</span>
    </div>`;

  return (params: unknown) => {
    const list = (Array.isArray(params) ? params : [params]) as Array<{ dataIndex?: number }>;
    const i = list.find((p) => typeof p?.dataIndex === "number")?.dataIndex;
    const step = i == null ? undefined : steps[i];
    if (i == null || !step) return "";
    const head = tooltip.hideLabel ? "" : `<div class="font-medium mb-1">${escapeHtml(names[i])}</div>`;
    const key = keys[i]!;
    const kindLabel = String(config[key]?.label ?? step.direction);
    const rows =
      step.kind === "start" || step.kind === "total"
        ? row(key, kindLabel, formatWaterfallDelta(step))
        : row(key, kindLabel, formatWaterfallDelta(step)) +
          row("", "Running total", formatValue(step.end));
    return tooltipShell(`${head}<div class="grid gap-1.5">${rows}</div>`, tooltip, chartId);
  };
}

export function compileWaterfallOption(ctx: CompileContext): EChartsOption {
  const wf = ctx.parts.find((p): p is WaterfallPart => p.type === "waterfall");
  const nameKey = wf?.nameKey ?? ctx.nameKey ?? "name";
  const valueKey = wf?.valueKey ?? ctx.valueKey ?? "value";
  const typeKey = wf?.typeKey ?? "type";
  const byDirection = (wf?.colorBy ?? "direction") === "direction";
  const showConnectors = wf?.connectors ?? false;
  const showLabels = wf?.showLabels ?? true;
  const horizontal = ctx.cartesian?.layout === "horizontal";
  const hasGrid = ctx.parts.some((p) => p.type === "grid");
  // The brush footer is a column strip; it has no meaning next to rows.
  const hasBrush = !horizontal && ctx.parts.some((p) => p.type === "brush");

  const rows = ctx.data as Record<string, unknown>[];
  const steps = buildWaterfallSteps(rows, valueKey, typeKey);
  const radius = resolveBarRadius(wf?.radius, ctx.cartesian?.barRadius, ctx.chartId);
  const gaps = barLayoutGaps(ctx.chartId);
  const chrome = resolveCanvasChartChrome(ctx.chartId);

  // The root merges the direction defaults into the config (legend, CSS vars).
  // A headless compile may not have them: color from the merged config then.
  const directionConfig = byDirection
    ? withWaterfallDirectionConfig(ctx.config as ChartConfig, wf?.higherIsBetter ?? true)
    : (ctx.config as ChartConfig);
  const rawNames = rows.map((row) => String(row[nameKey] ?? ""));
  const names = rawNames.map((name) => ctx.config[name]?.label?.toString() ?? name);
  const colorKeys = steps.map((s, i) => (byDirection ? s.direction : rawNames[i]!));
  const colorOf = (key: string): string => {
    if (ctx.config[key] || !byDirection) return ctx.resolveColor(key, 0);
    const colors = directionConfig[key]?.colors;
    const dark = isChartDark(ctx.chartId);
    const pick = dark ? (colors?.dark ?? colors?.light) : (colors?.light ?? colors?.dark);
    return pick?.[0] ?? ctx.resolveColor(key, 0);
  };

  const categoryAxis = {
    type: "category" as const,
    data: names,
    // Rows read from the top down, like a statement.
    ...(horizontal ? { inverse: true } : {}),
    // A bridge reads step by step: with few steps every label must show (the
    // auto interval hid every other one on a four-bar card).
    ...(names.length <= 12 ? { axisLabel: { interval: 0 } } : {}),
  };
  const valueAxis = { type: "value" as const, splitLine: { show: hasGrid } };

  const dataZoom = buildCategoryDataZoom(hasBrush, { chartVariant: "waterfall" });
  const base: EChartsOption = {
    grid: withValueLabelRoom(
      resolveCartesianGrid(
        ctx.parts,
        ctx.cartesian?.externalBrush,
        horizontal ? 4 : gridBottomWithZoom(hasBrush),
        horizontal,
      ),
      showLabels ? steps.map(formatWaterfallDelta) : [],
      { horizontal, fontSize: CHART_TYPOGRAPHY.axis.fontSize },
    ),
    tooltip: { trigger: "axis" },
    legend: { show: false },
    xAxis: horizontal ? valueAxis : categoryAxis,
    yAxis: horizontal ? categoryAxis : valueAxis,
    ...(dataZoom ? { dataZoom } : {}),
    series: [
      {
        type: "bar",
        id: PLACEHOLDER_ID,
        name: PLACEHOLDER_ID,
        stack: "wf",
        // Stack across signs: a step that crosses zero starts at the running total.
        stackStrategy: "all",
        ...gaps,
        silent: true,
        animation: false,
        itemStyle: { color: "rgba(0,0,0,0)", borderColor: "rgba(0,0,0,0)" },
        emphasis: { disabled: true },
        tooltip: { show: false },
        data: steps.map((s) => (s.kind === "start" || s.kind === "total" ? 0 : Math.min(s.start, s.end))),
      },
      {
        type: "bar",
        id: VALUES_ID,
        name: VALUES_ID,
        stack: "wf",
        stackStrategy: "all",
        ...gaps,
        ...hoverFocusOrOff(isHoverFocusOn(ctx), waterfallColumnFocus()),
        label: {
          show: showLabels,
          color: chrome.muted,
          fontSize: CHART_TYPOGRAPHY.axis.fontSize,
          formatter: (p: { dataIndex: number }) => {
            const step = steps[p.dataIndex];
            return step ? formatWaterfallDelta(step) : "";
          },
        },
        data: steps.map((s, i) => {
          const isColumn = s.kind === "start" || s.kind === "total";
          // Round only the end the step moves to; the start end stays square.
          const sign = isColumn ? s.delta : s.end - s.start;
          return {
            value: isColumn ? s.delta : Math.abs(s.end - s.start),
            itemStyle: {
              color: colorOf(colorKeys[i]!),
              borderRadius: signedBarBorderRadius(sign, radius, horizontal),
            },
            label: { position: labelPosition(s, horizontal) },
            [NQ_SERIES_KEY]: valueKey,
            [NQ_DATUM]: rows[i] as Record<string, unknown>,
          };
        }),
      },
      ...(showConnectors && steps.length > 1
        ? [connectorSeries(steps, horizontal, barFill(gaps.barCategoryGap), chrome.muted)]
        : []),
    ],
  };

  const out = applyChartUiToOption(ctx, base);
  const tooltipPart = ctx.parts.find((p): p is TooltipPart => p.type === "tooltip");
  if (!tooltipPart || tooltipPart.hide || !out.tooltip || Array.isArray(out.tooltip)) return out;
  return {
    ...out,
    tooltip: {
      ...out.tooltip,
      formatter: waterfallTooltipFormatter(
        steps,
        names,
        colorKeys,
        directionConfig,
        tooltipPart,
        ctx.chartId,
      ) as never,
    },
  };
}
