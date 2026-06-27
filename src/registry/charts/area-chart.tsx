"use client";

import { type ChartConfig } from "@/registry/ui/chart";
import type { ChartPlotInsets } from "@/registry/echarts-core/chart-grid";
import { createCartesianChart } from "@/registry/echarts-core/create-cartesian-chart";
import { compileAreaOption } from "@/registry/echarts-core/compile-area";
import { usePartId, useRegisterPart } from "@/registry/echarts-core/part-registry";
import type { StackType } from "@/registry/echarts-core/parts/types";
import { ChartBackground } from "@/registry/ui/background";
import {
  BeeChartLegend,
  bindChartLegendLayer,
  type ChartLegendVariant,
} from "@/registry/ui/legend";
import { ChartTooltip, type TooltipRoundness, type TooltipVariant } from "@/registry/ui/tooltip";
import { useState } from "react";

type BeeAreaChartProps<
  TData extends Record<string, unknown>,
  TConfig extends Record<string, ChartConfig[string]>,
> = {
  config: TConfig;
  data: TData[];
  children: React.ReactNode;
  className?: string;
  xDataKey?: keyof TData & string;
  stackType?: StackType;
  isLoading?: boolean;
  showBrush?: boolean;
  brushFormatLabel?: (value: unknown, index: number) => string;
};

type AreaChartCanvasProps<TData extends Record<string, unknown>> = {
  data: TData[];
  xDataKey?: string;
  stackType?: StackType;
  externalBrush?: boolean;
  onPlotRect?: (insets: ChartPlotInsets) => void;
};

const { Chart: AreaChartInner } = createCartesianChart<
  Record<string, unknown>,
  Record<string, ChartConfig[string]>,
  BeeAreaChartProps<Record<string, unknown>, Record<string, ChartConfig[string]>>,
  AreaChartCanvasProps<Record<string, unknown>>
>({
  displayName: "BeeAreaChart",
  compile: compileAreaOption,
  loadingVariant: "area",
  defaultLoadingPoints: 12,
  defaults: { stackType: "default", isLoading: false, showBrush: true },
  getRootFields: ({ stackType }, xKey) => ({
    xDataKey: xKey,
    cartesian: { stackType, externalBrush: true },
  }),
  getCompileRoot: ({ data, xDataKey, stackType, externalBrush }) => ({
    data,
    xDataKey,
    cartesian: { stackType, externalBrush },
  }),
  mapCanvasProps: ({ stackType }, { chartData, xKey, externalBrush, onPlotRect }) => ({
    data: chartData,
    xDataKey: xKey,
    stackType,
    externalBrush,
    onPlotRect,
  }),
});

export function BeeAreaChart<
  TData extends Record<string, unknown>,
  TConfig extends Record<string, ChartConfig[string]>,
>(props: BeeAreaChartProps<TData, TConfig>) {
  return <AreaChartInner {...props} />;
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
}: {
  dataKey?: string;
  tickFormatter?: (value: unknown) => string;
}) {
  const id = usePartId();
  useRegisterPart({ type: "xAxis", id, dataKey, tickFormatter });
  return null;
}

export function YAxis() {
  const id = usePartId();
  useRegisterPart({ type: "yAxis", id });
  return null;
}

export function Area({
  dataKey,
  curveType = "monotone",
  variant,
}: {
  dataKey: string;
  curveType?: "linear" | "monotone" | "step" | "bump";
  variant?: string;
}) {
  const id = usePartId();
  useRegisterPart({ type: "area", id, dataKey, curveType, variant });
  return null;
}

export function Tooltip(props: {
  variant?: TooltipVariant;
  roundness?: TooltipRoundness;
  hideLabel?: boolean;
  hideIndicator?: boolean;
}) {
  return <ChartTooltip {...props} />;
}

export function Legend(props: {
  variant?: ChartLegendVariant;
  align?: "left" | "center" | "right";
  isClickable?: boolean;
}) {
  const id = usePartId();
  useRegisterPart({ type: "legend", id, variant: props.variant, align: props.align, isClickable: props.isClickable });
  const [selected, setSelected] = useState<string | null>(null);
  return (
    <BeeChartLegend
      variant={props.variant}
      align={props.align}
      isClickable={props.isClickable}
      selected={selected}
      onSelectChange={setSelected}
    />
  );
}

bindChartLegendLayer(Legend);

export function Dot() {
  return null;
}

export function ActiveDot() {
  return null;
}
