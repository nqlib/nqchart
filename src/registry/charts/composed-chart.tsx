"use client";

import { type ChartConfig } from "@/registry/ui/chart";
import type { ChartPlotInsets } from "@/registry/echarts-core/chart-grid";
import {
  createCartesianChart,
  type CartesianChartBaseProps,
} from "@/registry/echarts-core/create-cartesian-chart";
import type { ChartHandle } from "@/registry/echarts-core/chart-handle";
import { compileComposedOption } from "@/registry/echarts-core/compile-composed";
import { getEcharts } from "@/registry/echarts-core/echarts-init";
import { BarChart, CustomChart, LineChart } from "echarts/charts";
import type { NQMarkEvent } from "@/registry/echarts-core/nq-mark-event";
import { usePartId, useRegisterPart } from "@/registry/echarts-core/part-registry";
import type { NQScale } from "@/registry/echarts-core/parts/types";
import { ChartBackground } from "@/registry/ui/background";
import {
  NQChartLegend,
  bindChartLegendLayer,
  type ChartLegendVariant,
} from "@/registry/ui/legend";
import { ChartTooltip, type TooltipRoundness, type TooltipVariant } from "@/registry/ui/tooltip";
import type { EChartsType } from "echarts/core";
import { useState, type Ref } from "react";

const COMPOSED_ECHARTS_MODULES = [BarChart, LineChart, CustomChart];
getEcharts(COMPOSED_ECHARTS_MODULES);

type NQComposedChartProps<
  TData extends Record<string, unknown>,
  TConfig extends Record<string, ChartConfig[string]>,
> = Omit<CartesianChartBaseProps<TData, TConfig>, "config"> & {
  config: TConfig;
  loadingBars?: number;
  barRadius?: number;
};

type ComposedChartCanvasProps<TData extends Record<string, unknown>> = {
  data: TData[];
  fullData?: TData[];
  indexOffset?: number;
  xDataKey?: string;
  barRadius?: number;
  externalBrush?: boolean;
  onPlotRect?: (insets: ChartPlotInsets) => void;
  onMarkClick?: (event: NQMarkEvent) => void;
  onChartReady?: (instance: EChartsType) => void;
  chartRef?: Ref<ChartHandle | null>;
};

const { Chart: ComposedChartInner } = createCartesianChart<
  Record<string, unknown>,
  Record<string, ChartConfig[string]>,
  NQComposedChartProps<Record<string, unknown>, Record<string, ChartConfig[string]>>,
  ComposedChartCanvasProps<Record<string, unknown>>
>({
  displayName: "NQComposedChart",
  compile: compileComposedOption,
  loadingVariant: "composed",
  defaultLoadingPoints: 8,
  echartsModules: COMPOSED_ECHARTS_MODULES,
  // `barRadius` intentionally unset — see NQBarChart: a default here would
  // short-circuit the compile-time `--radius-sm` lookup.
  defaults: { isLoading: false, showBrush: true },
  getLoadingPoints: ({ loadingBars }) => loadingBars ?? 8,
  getRootFields: ({ barRadius }, xKey) => ({
    xDataKey: xKey,
    cartesian: { barRadius, externalBrush: true },
  }),
  getCompileRoot: ({ data, xDataKey, barRadius, externalBrush }) => ({
    data,
    xDataKey,
    cartesian: { barRadius, externalBrush },
  }),
  mapCanvasProps: ({ barRadius }, shell) => ({
    data: shell.chartData,
    fullData: shell.fullData,
    indexOffset: shell.brushStartIndex,
    xDataKey: shell.xKey,
    barRadius,
    externalBrush: shell.externalBrush,
    onPlotRect: shell.onPlotRect,
    onMarkClick: shell.onMarkClick,
    onChartReady: shell.onChartReady,
    chartRef: shell.chartRef,
  }),
});

export function NQComposedChart<
  TData extends Record<string, unknown>,
  TConfig extends Record<string, ChartConfig[string]>,
>(props: NQComposedChartProps<TData, TConfig>) {
  return <ComposedChartInner {...props} />;
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
  yAxisId,
  barProps,
  radius,
  stackId,
  showInLegend,
  showLabels,
  labelFormatter,
}: {
  dataKey: string;
  yAxisId?: string;
  /** @deprecated use flat `yAxisId` */
  barProps?: { yAxisId?: string };
  radius?: number;
  stackId?: string;
  showInLegend?: boolean;
  showLabels?: boolean;
  labelFormatter?: (value: unknown) => string;
}) {
  const id = usePartId();
  useRegisterPart({
    type: "bar",
    id,
    dataKey,
    yAxisId: yAxisId ?? barProps?.yAxisId,
    radius,
    stackId,
    showInLegend,
    showLabels,
    labelFormatter,
  });
  return null;
}

export function Line({
  dataKey,
  yAxisId,
  lineProps,
  curveType = "linear",
  variant,
  showInLegend,
  showLabels,
  labelFormatter,
}: {
  dataKey: string;
  yAxisId?: string;
  curveType?: "linear" | "monotone" | "step";
  /** @deprecated use flat `yAxisId` */
  lineProps?: { yAxisId?: string };
  /** `points` — markers only (e.g. box-plot median ticks). `dashed` / `dotted` set stroke dash. */
  variant?: "points" | "solid" | "dashed" | "dotted";
  showInLegend?: boolean;
  showLabels?: boolean;
  labelFormatter?: (value: unknown) => string;
}) {
  const id = usePartId();
  useRegisterPart({
    type: "line",
    id,
    dataKey,
    curveType,
    yAxisId: yAxisId ?? lineProps?.yAxisId,
    variant,
    showInLegend,
    showLabels,
    labelFormatter,
  });
  return null;
}

export function Area({
  dataKey,
  curveType = "monotone",
  variant,
  yAxisId,
  stackId,
  showInLegend,
  showLabels,
  labelFormatter,
}: {
  dataKey: string;
  curveType?: "linear" | "monotone" | "step" | "bump";
  variant?: string;
  yAxisId?: string;
  stackId?: string;
  showInLegend?: boolean;
  showLabels?: boolean;
  labelFormatter?: (value: unknown) => string;
}) {
  const id = usePartId();
  useRegisterPart({
    type: "area",
    id,
    dataKey,
    curveType,
    variant,
    yAxisId,
    stackId,
    showInLegend,
    showLabels,
    labelFormatter,
  });
  return null;
}

/** Box-plot whiskers — stems from min↔Q1 and Q3↔max with end caps. */
export function Whiskers({
  minKey,
  q1Key,
  q3Key,
  maxKey,
  dataKey = "whiskers",
  showInLegend = true,
}: {
  minKey: string;
  q1Key: string;
  q3Key: string;
  maxKey: string;
  dataKey?: string;
  showInLegend?: boolean;
}) {
  const id = usePartId();
  useRegisterPart({
    type: "whiskers",
    id,
    minKey,
    q1Key,
    q3Key,
    maxKey,
    dataKey,
    showInLegend,
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
