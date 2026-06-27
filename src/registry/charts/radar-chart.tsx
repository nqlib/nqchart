"use client";

import { type ChartConfig, ChartContainer, getLoadingData } from "@/registry/ui/chart";
import { ChartPlotShell } from "@/registry/echarts-core/chart-plot-shell";
import { EChartsHost } from "@/registry/echarts-core/echarts-host";
import { PartRegistryProvider, usePartId, useRegisterPart } from "@/registry/echarts-core/part-registry";
import { compileRadarOption } from "@/registry/echarts-core/compile-radar";
import { useCompiledOption } from "@/registry/echarts-core/use-compiled-option";
import {
  BeeChartLegend,
  bindChartLegendLayer,
  type ChartLegendVariant,
} from "@/registry/ui/legend";
import { ChartTooltip } from "@/registry/ui/tooltip";
import type { ReactNode } from "react";
import { useState } from "react";

type BeeRadarChartProps<
  TData extends Record<string, unknown>,
  TConfig extends Record<string, ChartConfig[string]>,
> = {
  config: TConfig;
  data: TData[];
  children: ReactNode;
  className?: string;
  isLoading?: boolean;
};

function RadarChartCanvas<TData extends Record<string, unknown>>({ data }: { data: TData[] }) {
  const { option, colorEpoch } = useCompiledOption(compileRadarOption, { data });
  return <EChartsHost option={option} colorEpoch={colorEpoch} />;
}

export function BeeRadarChart<
  TData extends Record<string, unknown>,
  TConfig extends Record<string, ChartConfig[string]>,
>({ config, data, children, className, isLoading }: BeeRadarChartProps<TData, TConfig>) {
  const displayData = isLoading ? (getLoadingData(6) as unknown as TData[]) : data;
  return (
    <PartRegistryProvider>
      <ChartContainer config={config} className={className} isLoading={isLoading}>
        <ChartPlotShell
          isLoading={isLoading}
          loadingVariant="radar"
          canvas={<RadarChartCanvas data={displayData} />}
        >
          {children}
        </ChartPlotShell>
      </ChartContainer>
    </PartRegistryProvider>
  );
}

export function PolarGrid({ variant }: { variant?: string }) {
  const id = usePartId();
  useRegisterPart({ type: "polarGrid", id, variant });
  return null;
}

export function PolarAngleAxis({ dataKey }: { dataKey?: string }) {
  const id = usePartId();
  useRegisterPart({ type: "polarAngleAxis", id, dataKey });
  return null;
}

export function Radar({ dataKey, variant }: { dataKey: string; variant?: string }) {
  const id = usePartId();
  useRegisterPart({ type: "radar", id, dataKey, variant });
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
