"use client";

import { type ChartConfig, ChartContainer } from "@/registry/ui/chart";
import { ChartPlotShell } from "@/registry/echarts-core/chart-plot-shell";
import { EChartsHost } from "@/registry/echarts-core/echarts-host";
import { getEcharts } from "@/registry/echarts-core/echarts-init";
import { TreemapChart } from "echarts/charts";
import { PartRegistryProvider, usePartId, useRegisterPart } from "@/registry/echarts-core/part-registry";
import { compileTreemapOption } from "@/registry/echarts-core/compile-treemap";
import { useCompiledOption } from "@/registry/echarts-core/use-compiled-option";
import type { TreemapNode } from "@/registry/echarts-core/parts/types";
import {
  useChartInteraction,
  withMarkPointerCursor,
} from "@/registry/echarts-core/use-chart-interaction";
import type { ChartHandle } from "@/registry/echarts-core/chart-handle";
import type { NQMarkEvent } from "@/registry/echarts-core/nq-mark-event";
import { ChartTooltip } from "@/registry/ui/tooltip";
import type { EChartsType } from "echarts/core";
import type { ReactNode, Ref } from "react";

const TREEMAP_ECHARTS_MODULES = [TreemapChart];
getEcharts(TREEMAP_ECHARTS_MODULES);

type NQTreemapChartProps<TConfig extends Record<string, ChartConfig[string]>> = {
  config: TConfig;
  data: TreemapNode[] | Record<string, unknown>[];
  children: ReactNode;
  className?: string;
  isLoading?: boolean;
  onMarkClick?: (event: NQMarkEvent) => void;
  onChartReady?: (instance: EChartsType) => void;
  chartRef?: Ref<ChartHandle | null>;
};

function TreemapChartCanvas({
  tree,
  onMarkClick,
  onChartReady,
  chartRef,
}: {
  tree: TreemapNode[];
  onMarkClick?: (event: NQMarkEvent) => void;
  onChartReady?: (instance: EChartsType) => void;
  chartRef?: Ref<ChartHandle | null>;
}) {
  const { option, colorEpoch } = useCompiledOption(compileTreemapOption, { data: [] });
  // A tile's identity is its node name, exactly as a pie slice's is.
  const { eventHandlers, onChartInstance, pointerEnabled } = useChartInteraction({
    onMarkClick,
    onChartReady,
    chartRef,
    data: tree as unknown as Record<string, unknown>[],
    nameKey: "name",
    valueKey: "value",
  });
  return (
    <EChartsHost
      option={withMarkPointerCursor(option, pointerEnabled)}
      colorEpoch={colorEpoch}
      eventHandlers={eventHandlers}
      onChartInstance={onChartInstance}
      echartsModules={TREEMAP_ECHARTS_MODULES}
    />
  );
}

export function NQTreemapChart<TConfig extends Record<string, ChartConfig[string]>>({
  config,
  data,
  children,
  className,
  isLoading,
  onMarkClick,
  onChartReady,
  chartRef,
}: NQTreemapChartProps<TConfig>) {
  const tree = data as TreemapNode[];
  return (
    <PartRegistryProvider>
      <ChartContainer config={config} className={className} isLoading={isLoading}>
        <ChartPlotShell
          isLoading={isLoading}
          loadingVariant="treemap"
          canvas={
            <TreemapChartCanvas
              tree={tree}
              onMarkClick={onMarkClick}
              onChartReady={onChartReady}
              chartRef={chartRef}
            />
          }
        >
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
  showLabels?: boolean;
};

export function Tiles({ isClickable = false, showLabels = true }: TilesProps = {}) {
  const id = usePartId();
  useRegisterPart({
    type: "treemapStyle",
    id,
    isClickable,
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
