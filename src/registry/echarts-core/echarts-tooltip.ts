import type { ChartConfig } from "@/registry/ui/chart";
import { getColorsCount } from "@/registry/ui/chart";
import { configKeyFromDisplayName } from "./config-key-from-display-name";
import type { TooltipPart } from "./parts/types";
import type { EChartsOption } from "echarts";

type TooltipAxisParams = {
  seriesName?: string;
  seriesId?: string;
  name?: string;
  value?: unknown;
};

const ROUNDNESS_CLASS = {
  sm: "rounded-sm",
  md: "rounded-md",
  lg: "rounded-lg",
  xl: "rounded-xl",
} as const;

const VARIANT_CLASS = {
  default: "bg-background",
  "frosted-glass": "bg-background/70 backdrop-blur-sm",
} as const;

function escapeHtml(value: unknown) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function indicatorStyle(dataKey: string, colorsCount: number) {
  if (colorsCount <= 1) {
    return `background:var(--color-${dataKey}-0)`;
  }
  const stops = Array.from({ length: colorsCount }, (_, i) => {
    const offset = (i / (colorsCount - 1)) * 100;
    return `var(--color-${dataKey}-${i}) ${offset}%`;
  }).join(", ");
  return `background:linear-gradient(to right,${stops})`;
}

function formatValue(value: unknown): string {
  if (typeof value === "number") return value.toLocaleString();
  // Radar item tooltips pass the full indicator vector — join, don't take [0].
  if (Array.isArray(value) && value.every((v) => typeof v === "number")) {
    return value.map((v) => (v as number).toLocaleString()).join(" · ");
  }
  if (Array.isArray(value) && typeof value[0] === "number") {
    return value[0].toLocaleString();
  }
  return escapeHtml(value);
}

function tooltipShell(
  inner: string,
  tooltip: TooltipPart | undefined,
  chartId: string,
) {
  const variant = tooltip?.variant ?? "default";
  const roundness = tooltip?.roundness ?? "lg";
  return `<div class="nq-echarts-tooltip pointer-events-none text-foreground border-border/50 grid min-w-32 gap-1.5 border px-2.5 py-1.5 text-xs shadow-xl ${ROUNDNESS_CLASS[roundness]} ${VARIANT_CLASS[variant]}" data-chart="${chartId}">
    ${inner}
  </div>`;
}

function formatItemTooltipHtml(
  params: TooltipAxisParams | TooltipAxisParams[],
  config: ChartConfig,
  tooltip: TooltipPart | undefined,
  chartId: string,
) {
  const item = (Array.isArray(params) ? params[0] : params) as TooltipAxisParams | undefined;
  if (!item) return "";

  const displayName = String(item.name ?? item.seriesName ?? "");
  const key = configKeyFromDisplayName(displayName, config);
  const entry = config[key];
  const labelText = escapeHtml(entry?.label ?? displayName);
  const hideLabel = tooltip?.hideLabel ?? false;
  const hideIndicator = tooltip?.hideIndicator ?? false;
  const colorsCount = entry ? getColorsCount(entry) : 1;
  const dot = hideIndicator
    ? ""
    : `<span class="inline-block h-2.5 w-2.5 shrink-0 rounded-[2px] mr-2" style="${indicatorStyle(key, colorsCount)}"></span>`;

  const row = `<div class="flex w-full items-center justify-between gap-4 leading-none">
    <span class="text-muted-foreground flex items-center">${dot}${labelText}</span>
    <span class="font-mono font-medium tabular-nums">${formatValue(item.value)}</span>
  </div>`;

  const labelRow =
    !hideLabel && displayName && entry?.label?.toString() !== displayName
      ? `<div class="font-medium mb-1">${escapeHtml(displayName)}</div>`
      : "";

  return tooltipShell(`${labelRow}<div class="grid gap-1.5">${row}</div>`, tooltip, chartId);
}

function inferTooltipTrigger(option: EChartsOption): "axis" | "item" {
  // compile-* already sets the correct trigger — prefer it so HTML Tooltip
  // registration does not overwrite item charts (radar/scatter/treemap/…) with axis.
  const existing = option.tooltip;
  if (
    existing &&
    !Array.isArray(existing) &&
    (existing.trigger === "item" || existing.trigger === "axis")
  ) {
    return existing.trigger;
  }

  const series = Array.isArray(option.series)
    ? option.series
    : option.series
      ? [option.series]
      : [];
  const types = series.map((s) => (s as { type?: string })?.type);
  if (
    types.some(
      (t) =>
        t === "pie" ||
        t === "gauge" ||
        t === "funnel" ||
        t === "radar" ||
        t === "treemap" ||
        t === "scatter",
    )
  ) {
    return "item";
  }
  if (option.polar && types.some((t) => t === "bar")) {
    return "item";
  }
  return "axis";
}

/**
 * Placement and behaviour that every tooltip wants, card or not.
 *
 * Deliberately excludes anything about how the box *looks*: see
 * {@link htmlCardChrome}.
 */
function sharedTooltipOptions() {
  return {
    confine: true,
    enterable: false,
    transitionDuration: 0,
    // Offset away from cursor so tooltip DOM never sits under the pointer.
    position: (
      point: [number, number],
      _params: unknown,
      _dom: HTMLElement,
      _rect: unknown,
      size: { contentSize: [number, number]; viewSize: [number, number] },
    ): [number, number] => {
      const [x, y] = point;
      const offsetX = 20;
      const offsetY = -20;
      const [cw, ch] = size.contentSize;
      const [vw, vh] = size.viewSize;
      let left = x + offsetX;
      let top = y + offsetY;
      if (left + cw > vw) left = Math.max(0, x - cw - offsetX);
      if (top < 0) top = y + Math.abs(offsetY);
      if (top + ch > vh) top = Math.max(0, vh - ch);
      return [left, top];
    },
  };
}

/**
 * Strips ECharts' own tooltip box so our HTML card is the only thing visible.
 *
 * This must be applied *only* when a formatter is actually drawing that card.
 * Applied without one — which is what a chart with no `<Tooltip />` part used to
 * get — it leaves ECharts' default text floating with no background, no padding
 * and no shadow, and it also defeats `themeNativeTooltip`, which only fills in a
 * background when none is set and therefore preserved `"transparent"`.
 */
function htmlCardChrome() {
  return {
    padding: 0,
    borderWidth: 0,
    backgroundColor: "transparent" as const,
    // HTML tooltips sit over the canvas — pointer-events must stay off or hover flickers.
    extraCssText: "box-shadow:none;pointer-events:none!important;",
  };
}

function mergeStableTooltip(
  option: EChartsOption,
  overrides: Record<string, unknown>,
  { htmlCard }: { htmlCard: boolean },
): EChartsOption {
  const existing = option.tooltip;
  if (Array.isArray(existing)) return option;
  if (existing?.show === false) return option;

  const merged = {
    ...(existing ?? {}),
    ...sharedTooltipOptions(),
    ...(htmlCard ? htmlCardChrome() : {}),
    ...overrides,
  } as EChartsOption["tooltip"];

  return { ...option, tooltip: merged };
}

function formatAxisTooltipHtml(
  params: TooltipAxisParams | TooltipAxisParams[],
  config: ChartConfig,
  tooltip: TooltipPart | undefined,
  chartId: string,
) {
  const items = (Array.isArray(params) ? params : [params]).filter(
    (p) => p.seriesName != null,
  );
  if (!items.length) return "";

  const variant = tooltip?.variant ?? "default";
  const roundness = tooltip?.roundness ?? "lg";
  const hideLabel = tooltip?.hideLabel ?? false;
  const hideIndicator = tooltip?.hideIndicator ?? false;

  const label = !hideLabel ? escapeHtml(items[0]?.name ?? "") : "";
  const labelRow = label
    ? `<div class="font-medium mb-1">${label}</div>`
    : "";

  const rows = items
    .map((item) => {
      const key = configKeyFromDisplayName(String(item.seriesName ?? item.seriesId ?? ""), config);
      const entry = config[key];
      const labelText = escapeHtml(entry?.label ?? key);
      const value = formatValue(item.value);
      const colorsCount = entry ? getColorsCount(entry) : 1;
      const dot = hideIndicator
        ? ""
        : `<span class="inline-block h-2.5 w-2.5 shrink-0 rounded-[2px] mr-2" style="${indicatorStyle(key, colorsCount)}"></span>`;

      return `<div class="flex w-full items-center justify-between gap-4 leading-none">
        <span class="text-muted-foreground flex items-center">${dot}${labelText}</span>
        <span class="font-mono font-medium tabular-nums">${value}</span>
      </div>`;
    })
    .join("");

  return tooltipShell(`${labelRow}<div class="grid gap-1.5">${rows}</div>`, tooltip, chartId);
}

export function applyTooltipToOption(
  option: EChartsOption,
  config: ChartConfig,
  chartId: string,
  tooltipPart: TooltipPart | undefined,
): EChartsOption {
  if (tooltipPart?.hide) {
    return { ...option, tooltip: { show: false } };
  }

  if (!tooltipPart) {
    // No `<Tooltip />` declared: keep ECharts' own box and let
    // `themeNativeTooltip` give it the popover colours.
    return mergeStableTooltip(option, {}, { htmlCard: false });
  }

  const trigger = inferTooltipTrigger(option);
  const formatter =
    trigger === "item"
      ? (params: TooltipAxisParams | TooltipAxisParams[]) =>
          formatItemTooltipHtml(params, config, tooltipPart, chartId)
      : (params: TooltipAxisParams | TooltipAxisParams[]) =>
          formatAxisTooltipHtml(params, config, tooltipPart, chartId);

  return mergeStableTooltip(option, { trigger, formatter }, { htmlCard: true });
}

export function hideBuiltInLegend(option: EChartsOption): EChartsOption {
  if (!option.legend) {
    return { ...option, legend: { show: false } };
  }
  if (Array.isArray(option.legend)) {
    return {
      ...option,
      legend: option.legend.map((l) => ({ ...l, show: false })),
    };
  }
  return { ...option, legend: { ...option.legend, show: false } };
}
