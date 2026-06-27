"use client";

import { type ChartConfig, ChartContainer } from "@/registry/ui/chart";
import { ChartPlotShell } from "@/registry/echarts-core/chart-plot-shell";
import { EChartsHost } from "@/registry/echarts-core/echarts-host";
import { PartRegistryProvider, usePartId, useRegisterPart } from "@/registry/echarts-core/part-registry";
import { compileTreemapOption } from "@/registry/echarts-core/compile-treemap";
import { useCompiledOption } from "@/registry/echarts-core/use-compiled-option";
import type { TreemapNode } from "@/registry/echarts-core/parts/types";
import { ChartTooltip } from "@/registry/ui/tooltip";
import type { ReactNode } from "react";

type BeeTreemapChartProps<TConfig extends Record<string, ChartConfig[string]>> = {
  config: TConfig;
  data: TreemapNode[] | Record<string, unknown>[];
  children: ReactNode;
  className?: string;
  isLoading?: boolean;
};

function TreemapChartCanvas() {
  const { option, colorEpoch } = useCompiledOption(compileTreemapOption, { data: [] });
  return <EChartsHost option={option} colorEpoch={colorEpoch} />;
}

export function BeeTreemapChart<TConfig extends Record<string, ChartConfig[string]>>({
  config,
  data,
  children,
  className,
  isLoading,
}: BeeTreemapChartProps<TConfig>) {
  const tree = data as TreemapNode[];
  return (
    <PartRegistryProvider>
      <ChartContainer config={config} className={className} isLoading={isLoading}>
        <ChartPlotShell isLoading={isLoading} loadingVariant="treemap" canvas={<TreemapChartCanvas />}>
          <RegisterTreemap tree={tree} />
          {children}
        </ChartPlotShell>
      </ChartContainer>
    </PartRegistryProvider>
  );
}

function RegisterTreemap({ tree }: { tree: TreemapNode[] }) {
  const id = usePartId();
  useRegisterPart({ type: "treemap", id, dataKey: "value", tree });
  return null;
}

type TilesProps = {
  isClickable?: boolean;
  glowingTiles?: string[];
  showLabels?: boolean;
};

export function Tiles({
  isClickable = false,
  glowingTiles = [],
  showLabels = true,
}: TilesProps = {}) {
  const id = usePartId();
  useRegisterPart({
    type: "treemapStyle",
    id,
    isClickable,
    glowingTiles,
    showLabels,
  });
  return null;
}

export function Tooltip() {
  return <ChartTooltip />;
}

export function Legend() {
  return null;
}
