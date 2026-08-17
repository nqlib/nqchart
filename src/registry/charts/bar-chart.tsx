"use client";

import {
  type ChartConfig,
} from "@/registry/ui/chart";
import { EChartsHost } from "@/registry/echarts-core/echarts-host";
import { getEcharts } from "@/registry/echarts-core/echarts-init";
import { BarChart, CustomChart } from "echarts/charts";
import { GraphicComponent } from "echarts/components";
import { usePartId, usePartsSnapshot, useRegisterPart } from "@/registry/echarts-core/part-registry";
import { useHoverTraceMarkLine } from "@/registry/echarts-core/use-hover-trace-mark-line";
import { useMonospaceCollapse } from "@/registry/echarts-core/use-monospace-collapse";
import { useMonospaceFoldAnimation } from "@/registry/echarts-core/use-monospace-fold-animation";
import type { ChartPlotInsets } from "@/registry/echarts-core/chart-grid";
import { compileBarOption } from "@/registry/echarts-core/compile-bar";
import { hoverTraceSeriesId } from "@/registry/echarts-core/hover-trace-bar";
import { useCompiledOption } from "@/registry/echarts-core/use-compiled-option";
import type { NQChartEventHandlers } from "@/registry/echarts-core/use-nq-echarts";
import type { BarLayout, StackType } from "@/registry/echarts-core/parts/types";
import {
  createCartesianChart,
  type CartesianChartBaseProps,
  type CartesianPlotRectState,
} from "@/registry/echarts-core/create-cartesian-chart";
import type { ChartHandle } from "@/registry/echarts-core/chart-handle";
import { useChartInstanceRef } from "@/registry/echarts-core/chart-instance-context";
import type { NQMarkEvent } from "@/registry/echarts-core/nq-mark-event";
import type { NQScale } from "@/registry/echarts-core/parts/types";
import {
  useChartInteraction,
  withMarkPointerCursor,
} from "@/registry/echarts-core/use-chart-interaction";
import { ChartBackground } from "@/registry/ui/background";
import {
  NQChartLegend,
  bindChartLegendLayer,
  type ChartLegendVariant,
} from "@/registry/ui/legend";
import { ChartTooltip, type TooltipRoundness, type TooltipVariant } from "@/registry/ui/tooltip";
import { useChart } from "@/registry/ui/chart";
import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState, type Ref } from "react";
import type { EChartsType } from "echarts/core";

const BAR_ECHARTS_MODULES = [BarChart, CustomChart, GraphicComponent];
getEcharts(BAR_ECHARTS_MODULES);

type ValidateConfigKeys<TData, TConfig> = {
  [K in keyof TConfig]: K extends keyof TData ? ChartConfig[string] : never;
};

type NQBarChartProps<
  TData extends Record<string, unknown>,
  TConfig extends Record<string, ChartConfig[string]>,
> = Omit<CartesianChartBaseProps<TData, TConfig>, "config"> & {
  config: TConfig & ValidateConfigKeys<TData, TConfig>;
  stackType?: StackType;
  layout?: BarLayout;
  loadingBars?: number;
  /** Default corner radius (px) for every `<Bar />`. */
  barRadius?: number;
  /** Chart layout preset — `histogram` uses touching bins with square corners. */
  variant?: "default" | "histogram";
  /** Fires when a `<Bar variant="hover-trace" />` category is focused (null = peak). */
  onHoverTraceChange?: (index: number | null) => void;
};

type BarChartCanvasProps<TData extends Record<string, unknown>> = {
  data: TData[];
  fullData?: TData[];
  indexOffset?: number;
  xDataKey?: string;
  layout?: BarLayout;
  stackType?: StackType;
  barRadius?: number;
  variant?: "default" | "histogram";
  externalBrush?: boolean;
  onPlotRect?: (insets: ChartPlotInsets) => void;
  chartReadyEpoch: number;
  onHoverTraceChange?: (index: number | null) => void;
  onMarkClick?: (event: NQMarkEvent) => void;
  onChartReady?: (instance: EChartsType) => void;
  chartRef?: Ref<ChartHandle | null>;
  hoverFocus?: boolean;
};

function BarChartCanvas<TData extends Record<string, unknown>>({
  data,
  fullData,
  indexOffset = 0,
  xDataKey,
  layout,
  stackType,
  barRadius,
  variant,
  externalBrush,
  onPlotRect,
  chartReadyEpoch,
  onHoverTraceChange,
  onMarkClick,
  onChartReady,
  chartRef,
  hoverFocus = true,
}: BarChartCanvasProps<TData>) {
  const { chartId } = useChart();
  const parts = usePartsSnapshot();
  const runtimeRef = useChartInstanceRef();
  const monospaceBar = parts.find((p) => p.type === "bar" && p.variant === "monospace");
  const hoverTraceBar = parts.find((p) => p.type === "bar" && p.variant === "hover-trace");
  const hoverTraceSeriesIdValue =
    hoverTraceBar?.type === "bar" ? hoverTraceSeriesId(hoverTraceBar.dataKey) : "";
  const hasMonospace = Boolean(monospaceBar);
  const hasHoverTrace = Boolean(hoverTraceBar);
  const [chartInstanceEpoch, setChartInstanceEpoch] = useState(0);
  const [monospaceHoveredIndex, setMonospaceHoveredIndex] = useState<number | null>(null);
  const [hoverTraceIndex, setHoverTraceIndex] = useState<number | null>(null);
  const onHoverTraceChangeRef = useRef(onHoverTraceChange);
  useEffect(() => {
    onHoverTraceChangeRef.current = onHoverTraceChange;
  });
  const hoverTraceHideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const monospaceCollapsed = useMonospaceCollapse(data, chartReadyEpoch);

  const clearHoverTraceHideTimer = useCallback(() => {
    if (hoverTraceHideTimerRef.current != null) {
      clearTimeout(hoverTraceHideTimerRef.current);
      hoverTraceHideTimerRef.current = null;
    }
  }, []);

  const scheduleHoverTraceHide = useCallback(() => {
    clearHoverTraceHideTimer();
    hoverTraceHideTimerRef.current = setTimeout(() => {
      setHoverTraceIndex(null);
      onHoverTraceChangeRef.current?.(null);
    }, 48);
  }, [clearHoverTraceHideTimer]);

  /* eslint-disable react-hooks/refs */
  const prevDataRef = useRef(data);
  if (prevDataRef.current !== data) {
    prevDataRef.current = data;
    setMonospaceHoveredIndex(null);
    setHoverTraceIndex(null);
  }
  /* eslint-enable react-hooks/refs */

  useEffect(() => {
    onHoverTraceChangeRef.current?.(null);
    clearHoverTraceHideTimer();
  }, [data, clearHoverTraceHideTimer]);

  useEffect(() => () => clearHoverTraceHideTimer(), [clearHoverTraceHideTimer]);

  useMonospaceFoldAnimation({
    chartRef: runtimeRef,
    enabled: hasMonospace,
    dataKey: monospaceBar?.type === "bar" ? monospaceBar.dataKey : "",
    rows: data,
    collapsed: monospaceCollapsed,
    hoveredIndex: monospaceHoveredIndex,
    chartReadyEpoch,
    chartInstanceEpoch,
  });

  const compileRoot = useMemo(
    () => ({
      data,
      xDataKey,
      cartesian: { layout, stackType, barRadius, variant, externalBrush },
      hoverFocus,
    }),
    [data, xDataKey, layout, stackType, barRadius, variant, externalBrush, hoverFocus],
  );

  const { option, colorEpoch } = useCompiledOption(compileBarOption, compileRoot);

  const extraHandlers = useMemo<NQChartEventHandlers | undefined>(() => {
    if (!hasMonospace && !hasHoverTrace) return undefined;
    return {
      onSeriesMouseOver: (params) => {
        if (params.componentType !== "series") return;
        if (hasMonospace && params.seriesType === "custom") {
          if (typeof params.dataIndex !== "number" || params.dataIndex < 0) return;
          const next = params.dataIndex;
          setMonospaceHoveredIndex((prev) => (prev === next ? prev : next));
          return;
        }
        if (hasHoverTrace && params.seriesType === "bar") {
          const seriesId = (params as { seriesId?: string }).seriesId;
          if (seriesId && seriesId !== hoverTraceSeriesIdValue) return;
          if (typeof params.dataIndex !== "number" || params.dataIndex < 0) return;
          clearHoverTraceHideTimer();
          const next = params.dataIndex;
          setHoverTraceIndex((prev) => (prev === next ? prev : next));
          onHoverTraceChangeRef.current?.(next);
        }
      },
      onGlobalOut: () => {
        if (hasMonospace) setMonospaceHoveredIndex(null);
        if (hasHoverTrace) scheduleHoverTraceHide();
      },
    };
  }, [
    hasMonospace,
    hasHoverTrace,
    hoverTraceSeriesIdValue,
    clearHoverTraceHideTimer,
    scheduleHoverTraceHide,
  ]);

  const { eventHandlers, onChartInstance, pointerEnabled } = useChartInteraction({
    onMarkClick,
    onChartReady: (instance) => {
      runtimeRef.current = instance;
      setChartInstanceEpoch((epoch) => epoch + 1);
      onChartReady?.(instance);
    },
    chartRef,
    data: (fullData ?? data) as Record<string, unknown>[],
    xDataKey,
    indexOffset,
    extraHandlers,
  });

  useHoverTraceMarkLine({
    chartRef: runtimeRef,
    chartId,
    enabled: hasHoverTrace,
    dataKey: hoverTraceBar?.type === "bar" ? hoverTraceBar.dataKey : "",
    rows: data,
    hoveredIndex: hoverTraceIndex,
    chartReadyEpoch,
    chartInstanceEpoch,
    colorEpoch,
  });

  const painted = withMarkPointerCursor(option, pointerEnabled);

  return (
    <EChartsHost
      option={painted}
      colorEpoch={colorEpoch}
      onPlotRect={onPlotRect}
      eventHandlers={eventHandlers}
      onChartInstance={onChartInstance}
      echartsModules={BAR_ECHARTS_MODULES}
      hoverFocus={hoverFocus}
    />
  );
}

function useBarPlotRectState(): CartesianPlotRectState {
  const [plotAlign, setPlotAlign] = useState<ChartPlotInsets | null>(null);
  const [chartReadyEpoch, setChartReadyEpoch] = useState(0);
  const chartReadyRef = useRef(false);

  const onPlotRect = useCallback((insets: ChartPlotInsets) => {
    setPlotAlign(insets);
    if (!chartReadyRef.current) {
      chartReadyRef.current = true;
      setChartReadyEpoch(1);
    }
  }, []);

  return { plotAlign, onPlotRect, canvasProps: { chartReadyEpoch } };
}

const { Chart: BarChartInner } = createCartesianChart<
  Record<string, unknown>,
  Record<string, ChartConfig[string]>,
  NQBarChartProps<Record<string, unknown>, Record<string, ChartConfig[string]>>,
  BarChartCanvasProps<Record<string, unknown>>
>({
  displayName: "NQBarChart",
  compile: compileBarOption,
  loadingVariant: "bar",
  defaultLoadingPoints: 8,
  defaults: {
    stackType: "default",
    layout: "vertical",
    variant: "default",
    isLoading: false,
    showBrush: true,
    // No `barRadius` default on purpose: a value here would short-circuit the
    // compile-time `--radius-sm` lookup. Left undefined so hosts that retune
    // `--radius` reach the bars; `resolveBarRadius` still falls back to the
    // static constant when there is no DOM.
  },
  getLoadingPoints: ({ loadingBars }) => loadingBars ?? 8,
  getRootFields: ({ layout, stackType, barRadius, variant }, xKey) => ({
    xDataKey: xKey,
    cartesian: { layout, stackType, barRadius, variant, externalBrush: true },
  }),
  Canvas: BarChartCanvas,
  usePlotRectState: useBarPlotRectState,
  echartsModules: BAR_ECHARTS_MODULES,
  mapCanvasProps: (
    { layout, stackType, barRadius, variant, onHoverTraceChange },
    {
      chartData,
      fullData,
      brushStartIndex,
      xKey,
      externalBrush,
      onPlotRect,
      canvasProps,
      onMarkClick,
      onChartReady,
      chartRef,
    },
  ) => ({
    data: chartData,
    fullData,
    indexOffset: brushStartIndex,
    xDataKey: xKey,
    layout,
    stackType,
    barRadius,
    variant,
    externalBrush,
    onPlotRect,
    onHoverTraceChange,
    onMarkClick,
    onChartReady,
    chartRef,
    chartReadyEpoch: canvasProps.chartReadyEpoch as number,
  }),
});

export function NQBarChart<
  TData extends Record<string, unknown>,
  TConfig extends Record<string, ChartConfig[string]>,
>(props: NQBarChartProps<TData, TConfig>) {
  return <BarChartInner {...props} />;
}

export { ChartBackground as Background };

export function Grid() {
  const id = usePartId();
  useRegisterPart({ type: "grid", id });
  return null;
}

export function XAxis({
  dataKey,
  tickFormatter,
  scale,
  reversed,
  labelRotate,
  labelInterval,
}: {
  dataKey?: string;
  tickFormatter?: (value: unknown, index?: number) => string;
  scale?: NQScale;
  reversed?: boolean;
  labelRotate?: number;
  labelInterval?: number | "auto";
}) {
  const id = usePartId();
  useRegisterPart({
    type: "xAxis",
    id,
    dataKey,
    tickFormatter,
    scale,
    reversed,
    labelRotate,
    labelInterval,
  });
  return null;
}

export function YAxis({
  yAxisId,
  orientation,
  domain,
  unit,
  tickFormatter,
  scale,
  reversed,
  labelRotate,
  labelInterval,
}: {
  yAxisId?: string;
  orientation?: "left" | "right";
  domain?: [number, number];
  unit?: string;
  tickFormatter?: (value: unknown, index?: number) => string;
  scale?: NQScale;
  reversed?: boolean;
  labelRotate?: number;
  labelInterval?: number | "auto";
}) {
  const id = usePartId();
  useRegisterPart({
    type: "yAxis",
    id,
    yAxisId,
    orientation,
    domain,
    unit,
    tickFormatter,
    scale,
    reversed,
    labelRotate,
    labelInterval,
  });
  return null;
}

export function Bar({
  dataKey,
  variant = "default",
  radius,
  stackId,
  yAxisId,
  showLabels,
  labelFormatter,
}: {
  dataKey: string;
  variant?: string;
  radius?: number;
  stackId?: string;
  yAxisId?: string;
  showLabels?: boolean;
  labelFormatter?: (value: unknown) => string;
}) {
  const id = usePartId();
  useRegisterPart({
    type: "bar",
    id,
    dataKey,
    variant,
    radius,
    stackId,
    yAxisId,
    showLabels,
    labelFormatter,
  });
  return null;
}

export function Tooltip({
  variant,
  roundness,
  hideLabel,
  hideIndicator,
  hide,
}: {
  variant?: TooltipVariant;
  roundness?: TooltipRoundness;
  hideLabel?: boolean;
  hideIndicator?: boolean;
  hide?: boolean;
}) {
  return (
    <ChartTooltip
      variant={variant}
      roundness={roundness}
      hideLabel={hideLabel}
      hideIndicator={hideIndicator}
      hide={hide}
    />
  );
}

export function Legend({
  variant = "rounded-square",
  align = "right",
  isClickable = false,
  hideIcon,
  className,
  selected: selectedProp,
  onSelectChange,
}: {
  variant?: ChartLegendVariant;
  align?: "left" | "center" | "right";
  isClickable?: boolean;
  hideIcon?: boolean;
  className?: string;
  selected?: string | null;
  onSelectChange?: (selected: string | null) => void;
}) {
  const id = usePartId();
  const [uncontrolled, setUncontrolled] = useState<string | null>(null);
  const selected = selectedProp !== undefined ? selectedProp : uncontrolled;
  useRegisterPart({ type: "legend", id, variant, align, isClickable, selected });
  const setSelected = onSelectChange ?? setUncontrolled;

  return (
    <NQChartLegend
      variant={variant}
      align={align}
      hideIcon={hideIcon}
      isClickable={isClickable}
      className={className}
      selected={selected}
      onSelectChange={setSelected}
    />
  );
}

export { ReferenceLine, ReferenceBand } from "@/registry/echarts-core/chart-parts";

bindChartLegendLayer(Legend);
