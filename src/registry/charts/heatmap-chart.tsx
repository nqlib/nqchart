"use client";

import { type ChartConfig, ChartContainer } from "@/registry/ui/chart";
import { ChartPlotShell } from "@/registry/echarts-core/chart-plot-shell";
import type { ChartPlotInsets } from "@/registry/echarts-core/chart-grid";
import { EChartsHost } from "@/registry/echarts-core/echarts-host";
import { getEcharts } from "@/registry/echarts-core/echarts-init";
import { HeatmapChart } from "echarts/charts";
import { DataZoomComponent, VisualMapComponent } from "echarts/components";
import { PartRegistryProvider, usePartId, useRegisterPart } from "@/registry/echarts-core/part-registry";
import { compileHeatmapOption } from "@/registry/echarts-core/compile-heatmap";
import { useCompiledOption } from "@/registry/echarts-core/use-compiled-option";
import type { HeatmapCell } from "@/registry/lib/chart-recipes";
import { usePartsSnapshot } from "@/registry/echarts-core/part-registry";
import {
  useChartInteraction,
  withMarkPointerCursor,
} from "@/registry/echarts-core/use-chart-interaction";
import type { ChartHandle } from "@/registry/echarts-core/chart-handle";
import type { NQMarkEvent } from "@/registry/echarts-core/nq-mark-event";
import type { HeatmapPart } from "@/registry/echarts-core/parts/types";
import type { EChartsType } from "echarts/core";
import { type ReactNode, type Ref, useState } from "react";

const HEATMAP_ECHARTS_MODULES = [HeatmapChart, VisualMapComponent, DataZoomComponent];
getEcharts(HEATMAP_ECHARTS_MODULES);

type NQHeatmapChartProps<TConfig extends Record<string, ChartConfig[string]>> = {
  config: TConfig;
  children: ReactNode;
  className?: string;
  isLoading?: boolean;
  onMarkClick?: (event: NQMarkEvent) => void;
  onChartReady?: (instance: EChartsType) => void;
  chartRef?: Ref<ChartHandle | null>;
  hoverFocus?: boolean;
};

function HeatmapChartCanvas({
  onPlotRect,
  onMarkClick,
  onChartReady,
  chartRef,
  hoverFocus = true,
}: {
  onPlotRect?: (insets: ChartPlotInsets) => void;
  onMarkClick?: (event: NQMarkEvent) => void;
  onChartReady?: (instance: EChartsType) => void;
  chartRef?: Ref<ChartHandle | null>;
  hoverFocus?: boolean;
}) {
  const { option, colorEpoch } = useCompiledOption(compileHeatmapOption, { data: [], hoverFocus });
  // Cells live on the `<Heatmap>` part rather than the root.
  const parts = usePartsSnapshot();
  const cells = (parts.find((p): p is HeatmapPart => p.type === "heatmap")?.cells ??
    []) as unknown as Record<string, unknown>[];
  const { eventHandlers, onChartInstance, pointerEnabled } = useChartInteraction({
    onMarkClick,
    onChartReady,
    chartRef,
    data: cells,
    // A cell sits at a row and a column. Rows are the series — that is how the
    // config already keys colour — so a click on Wed/3pm reads as
    // `seriesKey: "Wed"`, `category: "3pm"`.
    nameKey: "row",
    xDataKey: "col",
    valueKey: "value",
  });
  return (
    <EChartsHost
      option={withMarkPointerCursor(option, pointerEnabled)}
      colorEpoch={colorEpoch}
      onPlotRect={onPlotRect}
      eventHandlers={eventHandlers}
      onChartInstance={onChartInstance}
      echartsModules={HEATMAP_ECHARTS_MODULES}
      hoverFocus={hoverFocus}
    />
  );
}

export function NQHeatmapChart<TConfig extends Record<string, ChartConfig[string]>>({
  config,
  children,
  className,
  isLoading,
  onMarkClick,
  onChartReady,
  chartRef,
  hoverFocus = true,
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
          canvas={
            <HeatmapChartCanvas
              onPlotRect={setPlotAlign}
              onMarkClick={onMarkClick}
              onChartReady={onChartReady}
              chartRef={chartRef}
              hoverFocus={hoverFocus}
            />
          }
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
