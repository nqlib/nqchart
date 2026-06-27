"use client";

import { type ChartConfig, ChartContainer } from "@/registry/ui/chart";
import { ChartPlotShell } from "@/registry/echarts-core/chart-plot-shell";
import { EChartsHost } from "@/registry/echarts-core/echarts-host";
import { PartRegistryProvider, usePartId, useRegisterPart } from "@/registry/echarts-core/part-registry";
import { compileSankeyOption } from "@/registry/echarts-core/compile-sankey";
import { useCompiledOption } from "@/registry/echarts-core/use-compiled-option";
import type { SankeyGraph } from "@/registry/echarts-core/parts/types";
import { ChartTooltip } from "@/registry/ui/tooltip";
import type { ReactNode } from "react";

type BeeSankeyChartProps<TConfig extends Record<string, ChartConfig[string]>> = {
  config: TConfig;
  data: SankeyGraph;
  children: ReactNode;
  className?: string;
  linkVariant?: string;
  isLoading?: boolean;
};

function SankeyChartCanvas() {
  const { option, colorEpoch } = useCompiledOption(compileSankeyOption, { data: [] });
  return <EChartsHost option={option} colorEpoch={colorEpoch} />;
}

function RegisterSankey({
  graph,
  linkVariant,
}: {
  graph: SankeyGraph;
  linkVariant?: string;
}) {
  const id = usePartId();
  useRegisterPart({ type: "sankey", id, graph, linkVariant });
  return null;
}

export function BeeSankeyChart<TConfig extends Record<string, ChartConfig[string]>>({
  config,
  data,
  children,
  className,
  linkVariant = "source",
  isLoading,
}: BeeSankeyChartProps<TConfig>) {
  return (
    <PartRegistryProvider>
      <ChartContainer config={config} className={className} isLoading={isLoading}>
        <ChartPlotShell isLoading={isLoading} loadingVariant="sankey" canvas={<SankeyChartCanvas />}>
          <RegisterSankey graph={data} linkVariant={linkVariant} />
          {children}
        </ChartPlotShell>
      </ChartContainer>
    </PartRegistryProvider>
  );
}

export function Node() {
  return null;
}

export function NodeLabel(_: { position?: string; showValues?: boolean }) {
  return null;
}

export function Link({ variant }: { variant?: string }) {
  void variant;
  return null;
}

export function Tooltip() {
  return <ChartTooltip />;
}
