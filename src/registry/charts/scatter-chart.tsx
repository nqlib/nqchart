"use client";

import { type ChartConfig, ChartContainer, getLoadingData } from "@/registry/ui/chart";
import { ChartPlotShell } from "@/registry/echarts-core/chart-plot-shell";
import { EChartsHost } from "@/registry/echarts-core/echarts-host";
import { PartRegistryProvider, usePartId, useRegisterPart } from "@/registry/echarts-core/part-registry";
import { compileScatterOption } from "@/registry/echarts-core/compile-scatter";
import { useCompiledOption } from "@/registry/echarts-core/use-compiled-option";
import {
  BeeChartLegend,
  bindChartLegendLayer,
  type ChartLegendVariant,
} from "@/registry/ui/legend";
import { ChartTooltip } from "@/registry/ui/tooltip";
import type { ReactNode } from "react";
import { useState } from "react";

type BeeScatterChartProps<TConfig extends Record<string, ChartConfig[string]>> = {
  config: TConfig;
  children: ReactNode;
  className?: string;
  isLoading?: boolean;
};

function ScatterChartCanvas() {
  const { option, colorEpoch } = useCompiledOption(compileScatterOption, { data: [] });
  return <EChartsHost option={option} colorEpoch={colorEpoch} />;
}

export function BeeScatterChart<TConfig extends Record<string, ChartConfig[string]>>({
  config,
  children,
  className,
  isLoading,
}: BeeScatterChartProps<TConfig>) {
  return (
    <PartRegistryProvider>
      <ChartContainer config={config} className={className} isLoading={isLoading}>
        <ChartPlotShell isLoading={isLoading} loadingVariant="scatter" canvas={<ScatterChartCanvas />}>
          {children}
        </ChartPlotShell>
      </ChartContainer>
    </PartRegistryProvider>
  );
}

export function Grid() {
  const id = usePartId();
  useRegisterPart({ type: "grid", id });
  return null;
}

export function XAxis({ dataKey, name, unit }: { dataKey?: string; name?: string; unit?: string }) {
  const id = usePartId();
  useRegisterPart({ type: "xAxis", id, dataKey: dataKey ?? "x" });
  void name;
  void unit;
  return null;
}

export function YAxis({ dataKey, name, unit }: { dataKey?: string; name?: string; unit?: string }) {
  const id = usePartId();
  useRegisterPart({ type: "yAxis", id, dataKey: dataKey ?? "y" });
  void name;
  void unit;
  return null;
}

export function Scatter({
  dataKey,
  data,
  variant,
}: {
  dataKey: string;
  data: Array<Record<string, number>>;
  variant?: string;
}) {
  const id = usePartId();
  useRegisterPart({ type: "scatter", id, dataKey, points: data, variant });
  return null;
}

export function Tooltip() {
  return <ChartTooltip />;
}

export function Legend(props: { variant?: ChartLegendVariant; isClickable?: boolean }) {
  const id = usePartId();
  useRegisterPart({ type: "legend", id, variant: props.variant, isClickable: props.isClickable });
  const [selected, setSelected] = useState<string | null>(null);
  return (
    <BeeChartLegend
      variant={props.variant}
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
