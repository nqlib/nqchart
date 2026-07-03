"use client";

import { type ChartConfig, ChartContainer, getLoadingData } from "@/registry/ui/chart";
import { NQChartBrush } from "@/registry/echarts-core/nq-chart-brush";
import type { ChartPlotInsets } from "@/registry/echarts-core/chart-grid";
import { ChartPlotShell } from "@/registry/echarts-core/chart-plot-shell";
import { EChartsHost } from "@/registry/echarts-core/echarts-host";
import { PartRegistryProvider, usePartId, useRegisterPart } from "@/registry/echarts-core/part-registry";
import { compileWaterfallOption } from "@/registry/echarts-core/compile-waterfall";
import { useChartBrush } from "@/registry/echarts-core/use-chart-brush";
import { useCompiledOption } from "@/registry/echarts-core/use-compiled-option";
import { NQChartLegend } from "@/registry/ui/legend";
import { ChartTooltip } from "@/registry/ui/tooltip";
import type { ReactNode } from "react";
import { useState } from "react";

type NQWaterfallChartProps<
  TData extends Record<string, unknown>,
  TConfig extends Record<string, ChartConfig[string]>,
> = {
  config: TConfig;
  data: TData[];
  children: ReactNode;
  className?: string;
  nameKey?: string;
  valueKey?: string;
  isLoading?: boolean;
  showBrush?: boolean;
  brushFormatLabel?: (value: unknown, index: number) => string;
};

function WaterfallChartCanvas<TData extends Record<string, unknown>>({
  data,
  externalBrush,
  onPlotRect,
}: {
  data: TData[];
  externalBrush?: boolean;
  onPlotRect?: (insets: ChartPlotInsets) => void;
}) {
  const { option, colorEpoch } = useCompiledOption(compileWaterfallOption, {
    data,
    cartesian: { externalBrush },
  });
  return <EChartsHost option={option} colorEpoch={colorEpoch} onPlotRect={onPlotRect} />;
}

export function NQWaterfallChart<
  TData extends Record<string, unknown>,
  TConfig extends Record<string, ChartConfig[string]>,
>({
  config,
  data,
  children,
  className,
  nameKey = "name",
  valueKey = "value",
  isLoading,
  showBrush = true,
  brushFormatLabel,
}: NQWaterfallChartProps<TData, TConfig>) {
  const displayData = isLoading ? (getLoadingData(5) as unknown as TData[]) : data;
  const { visibleData, brushProps } = useChartBrush({ data: displayData, minSpan: 1 });
  const chartData = showBrush && !isLoading ? visibleData : displayData;
  const externalBrush = showBrush && !isLoading;
  const [plotAlign, setPlotAlign] = useState<ChartPlotInsets | null>(null);

  return (
    <PartRegistryProvider>
      <ChartContainer
        config={config}
        className={className}
        isLoading={isLoading}
        footer={
          showBrush && !isLoading ? (
            <NQChartBrush
              data={displayData}
              compile={compileWaterfallOption}
              rootFields={{ nameKey, valueKey, cartesian: { externalBrush: true } }}
              xDataKey={nameKey}
              formatLabel={brushFormatLabel}
              plotAlign={plotAlign}
              {...brushProps}
            />
          ) : undefined
        }
      >
        <ChartPlotShell
          isLoading={isLoading}
          loadingVariant="waterfall"
          canvas={
            <WaterfallChartCanvas
              data={chartData}
              externalBrush={externalBrush}
              onPlotRect={setPlotAlign}
            />
          }
        >
          <RegisterWaterfall nameKey={nameKey} valueKey={valueKey} />
          {children}
        </ChartPlotShell>
      </ChartContainer>
    </PartRegistryProvider>
  );
}

function RegisterWaterfall({
  nameKey,
  valueKey,
}: {
  nameKey: string;
  valueKey: string;
}) {
  const id = usePartId();
  useRegisterPart({ type: "waterfall", id, nameKey, valueKey, typeKey: "type" });
  return null;
}

export function Bars() {
  return null;
}

export function Grid() {
  const id = usePartId();
  useRegisterPart({ type: "grid", id });
  return null;
}

export function XAxis() {
  return null;
}

export function YAxis() {
  return null;
}

export function Tooltip() {
  return <ChartTooltip />;
}

export function Legend(props: { isClickable?: boolean }) {
  const id = usePartId();
  useRegisterPart({ type: "legend", id, isClickable: props.isClickable });
  const [selected, setSelected] = useState<string | null>(null);
  return (
    <NQChartLegend isClickable={props.isClickable} selected={selected} onSelectChange={setSelected} />
  );
}
