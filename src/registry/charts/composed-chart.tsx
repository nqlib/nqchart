"use client";

import { type ChartConfig } from "@/registry/ui/chart";
import type { ChartPlotInsets } from "@/registry/echarts-core/chart-grid";
import { createCartesianChart } from "@/registry/echarts-core/create-cartesian-chart";
import { compileComposedOption } from "@/registry/echarts-core/compile-composed";
import { CHART_BAR_CORNER_RADIUS_PX } from "@/registry/echarts-core/chart-corner-radius";
import { usePartId, useRegisterPart } from "@/registry/echarts-core/part-registry";
import { ChartBackground } from "@/registry/ui/background";
import {
  NQChartLegend,
  bindChartLegendLayer,
  type ChartLegendVariant,
} from "@/registry/ui/legend";
import { ChartTooltip, type TooltipRoundness, type TooltipVariant } from "@/registry/ui/tooltip";
import { useState } from "react";

type NQComposedChartProps<
  TData extends Record<string, unknown>,
  TConfig extends Record<string, ChartConfig[string]>,
> = {
  config: TConfig;
  data: TData[];
  children: React.ReactNode;
  className?: string;
  xDataKey?: keyof TData & string;
  isLoading?: boolean;
  loadingBars?: number;
  showBrush?: boolean;
  barRadius?: number;
  brushFormatLabel?: (value: unknown, index: number) => string;
};

type ComposedChartCanvasProps<TData extends Record<string, unknown>> = {
  data: TData[];
  xDataKey?: string;
  barRadius?: number;
  externalBrush?: boolean;
  onPlotRect?: (insets: ChartPlotInsets) => void;
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
  defaults: { isLoading: false, showBrush: true, barRadius: CHART_BAR_CORNER_RADIUS_PX },
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
  mapCanvasProps: ({ barRadius }, { chartData, xKey, externalBrush, onPlotRect }) => ({
    data: chartData,
    xDataKey: xKey,
    barRadius,
    externalBrush,
    onPlotRect,
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
}: {
  dataKey?: string;
  tickFormatter?: (value: unknown) => string;
}) {
  const id = usePartId();
  useRegisterPart({ type: "xAxis", id, dataKey, tickFormatter });
  return null;
}

export function YAxis({
  yAxisId,
  orientation,
  domain,
  unit,
}: {
  yAxisId?: string;
  orientation?: "left" | "right";
  domain?: [number, number];
  unit?: string;
}) {
  const id = usePartId();
  useRegisterPart({ type: "yAxis", id, yAxisId, orientation, domain, unit });
  return null;
}

export function Bar({
  dataKey,
  barProps,
  radius,
  stackId,
  showInLegend,
}: {
  dataKey: string;
  barProps?: { yAxisId?: string };
  radius?: number;
  stackId?: string;
  showInLegend?: boolean;
}) {
  const id = usePartId();
  useRegisterPart({
    type: "bar",
    id,
    dataKey,
    yAxisId: barProps?.yAxisId,
    radius,
    stackId,
    showInLegend,
  });
  return null;
}

export function Line({
  dataKey,
  lineProps,
  curveType = "linear",
  variant,
  showInLegend,
}: {
  dataKey: string;
  curveType?: "linear" | "monotone" | "step";
  lineProps?: { yAxisId?: string };
  /** `points` — markers only (e.g. box-plot median ticks). */
  variant?: "points";
  showInLegend?: boolean;
}) {
  const id = usePartId();
  useRegisterPart({
    type: "line",
    id,
    dataKey,
    curveType,
    yAxisId: lineProps?.yAxisId,
    variant,
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
}: {
  variant?: ChartLegendVariant;
  align?: "left" | "center" | "right";
  isClickable?: boolean;
  hideIcon?: boolean;
  className?: string;
}) {
  const id = usePartId();
  useRegisterPart({ type: "legend", id, variant, align, isClickable });
  const [selected, setSelected] = useState<string | null>(null);

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

bindChartLegendLayer(Legend);
