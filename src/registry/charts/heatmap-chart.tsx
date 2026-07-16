"use client";

import { type ChartConfig, ChartContainer } from "@/registry/ui/chart";
import { ChartPlotShell } from "@/registry/echarts-core/chart-plot-shell";
import type { ChartPlotInsets } from "@/registry/echarts-core/chart-grid";
import { EChartsHost } from "@/registry/echarts-core/echarts-host";
import { PartRegistryProvider, usePartId, useRegisterPart } from "@/registry/echarts-core/part-registry";
import { compileHeatmapOption } from "@/registry/echarts-core/compile-heatmap";
import { useCompiledOption } from "@/registry/echarts-core/use-compiled-option";
import type { HeatmapCell } from "@/registry/lib/chart-recipes";
import type { ReactNode } from "react";
import { useState } from "react";

type NQHeatmapChartProps<TConfig extends Record<string, ChartConfig[string]>> = {
  config: TConfig;
  children: ReactNode;
  className?: string;
  isLoading?: boolean;
};

function HeatmapChartCanvas({
  onPlotRect,
}: {
  onPlotRect?: (insets: ChartPlotInsets) => void;
}) {
  const { option, colorEpoch } = useCompiledOption(compileHeatmapOption, { data: [] });
  return <EChartsHost option={option} colorEpoch={colorEpoch} onPlotRect={onPlotRect} />;
}

export function NQHeatmapChart<TConfig extends Record<string, ChartConfig[string]>>({
  config,
  children,
  className,
  isLoading,
}: NQHeatmapChartProps<TConfig>) {
  // Heatmap is cartesian (x/y category axes) — clip a composed <Background /> to the
  // measured grid rect so it stays inside the axes.
  const [plotAlign, setPlotAlign] = useState<ChartPlotInsets | null>(null);

  return (
    <PartRegistryProvider>
      <ChartContainer config={config} className={className} isLoading={isLoading}>
        <ChartPlotShell
          isLoading={isLoading}
          loadingVariant="heatmap"
          plotRect={plotAlign}
          canvas={<HeatmapChartCanvas onPlotRect={setPlotAlign} />}
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
