"use client";

import { type ChartConfig, ChartContainer } from "@/registry/ui/chart";
import { ChartPlotShell } from "@/registry/echarts-core/chart-plot-shell";
import { EChartsHost } from "@/registry/echarts-core/echarts-host";
import { PartRegistryProvider, usePartId, useRegisterPart } from "@/registry/echarts-core/part-registry";
import { compileHeatmapOption } from "@/registry/echarts-core/compile-heatmap";
import { useCompiledOption } from "@/registry/echarts-core/use-compiled-option";
import type { HeatmapCell } from "@/registry/lib/chart-recipes";
import type { ReactNode } from "react";

type BeeHeatmapChartProps<TConfig extends Record<string, ChartConfig[string]>> = {
  config: TConfig;
  children: ReactNode;
  className?: string;
  isLoading?: boolean;
};

function HeatmapChartCanvas() {
  const { option, colorEpoch } = useCompiledOption(compileHeatmapOption, { data: [] });
  return <EChartsHost option={option} colorEpoch={colorEpoch} />;
}

export function BeeHeatmapChart<TConfig extends Record<string, ChartConfig[string]>>({
  config,
  children,
  className,
  isLoading,
}: BeeHeatmapChartProps<TConfig>) {
  return (
    <PartRegistryProvider>
      <ChartContainer config={config} className={className} isLoading={isLoading}>
        <ChartPlotShell
          isLoading={isLoading}
          loadingVariant="heatmap"
          canvas={<HeatmapChartCanvas />}
        >
          {children}
        </ChartPlotShell>
      </ChartContainer>
    </PartRegistryProvider>
  );
}

export function Heatmap({
  dataKey,
  data,
  xLabels,
  yLabels,
  min,
  max,
  enableZoom = true,
}: {
  dataKey: string;
  data: HeatmapCell[];
  xLabels?: string[];
  yLabels?: string[];
  min?: number;
  max?: number;
  /** Drag-pan and scroll-zoom on both axes (default on). */
  enableZoom?: boolean;
}) {
  const id = usePartId();
  useRegisterPart({ type: "heatmap", id, dataKey, cells: data, xLabels, yLabels, min, max, enableZoom });
  return null;
}

export function Grid() {
  return null;
}

export function XAxis() {
  return null;
}

export function YAxis() {
  return null;
}

export function Tooltip() {
  return null;
}

export function Legend() {
  return null;
}
