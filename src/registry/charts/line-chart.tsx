"use client";

import { type ChartConfig } from "@/registry/ui/chart";
import type { ChartPlotInsets } from "@/registry/echarts-core/chart-grid";
import {
  createCartesianChart,
  type CartesianChartBaseProps,
} from "@/registry/echarts-core/create-cartesian-chart";
import type { ChartHandle } from "@/registry/echarts-core/chart-handle";
import { compileLineOption } from "@/registry/echarts-core/compile-line";
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

type NQLineChartProps<
  TData extends Record<string, unknown>,
  TConfig extends Record<string, ChartConfig[string]>,
> = Omit<CartesianChartBaseProps<TData, TConfig>, "config"> & {
  config: TConfig;
};

type LineChartCanvasProps<TData extends Record<string, unknown>> = {
  data: TData[];
  fullData?: TData[];
  indexOffset?: number;
  xDataKey?: string;
  externalBrush?: boolean;
  onPlotRect?: (insets: ChartPlotInsets) => void;
  onMarkClick?: (event: NQMarkEvent) => void;
  onChartReady?: (instance: EChartsType) => void;
  chartRef?: Ref<ChartHandle | null>;
};

const { Chart: LineChartInner } = createCartesianChart<
  Record<string, unknown>,
  Record<string, ChartConfig[string]>,
  NQLineChartProps<Record<string, unknown>, Record<string, ChartConfig[string]>>,
  LineChartCanvasProps<Record<string, unknown>>
>({
  displayName: "NQLineChart",
  compile: compileLineOption,
  loadingVariant: "line",
  defaultLoadingPoints: 12,
  getRootFields: (_props, xKey) => ({
    xDataKey: xKey,
    cartesian: { externalBrush: true },
  }),
  getCompileRoot: ({ data, xDataKey, externalBrush }) => ({
    data,
    xDataKey,
    cartesian: { externalBrush },
  }),
  mapCanvasProps: (_props, shell) => ({
    data: shell.chartData,
    fullData: shell.fullData,
    indexOffset: shell.brushStartIndex,
    xDataKey: shell.xKey,
    externalBrush: shell.externalBrush,
    onPlotRect: shell.onPlotRect,
    onMarkClick: shell.onMarkClick,
    onChartReady: shell.onChartReady,
    chartRef: shell.chartRef,
  }),
});

export function NQLineChart<
  TData extends Record<string, unknown>,
  TConfig extends Record<string, ChartConfig[string]>,
>(props: NQLineChartProps<TData, TConfig>) {
  return <LineChartInner {...props} />;
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

export function Line({
  dataKey,
  curveType = "linear",
  yAxisId,
  lineProps,
  showLabels,
  labelFormatter,
}: {
  dataKey: string;
  curveType?: "linear" | "monotone" | "step";
  yAxisId?: string;
  /** @deprecated use flat `yAxisId` */
  lineProps?: { yAxisId?: string };
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
