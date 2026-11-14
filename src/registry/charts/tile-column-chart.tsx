"use client";

import { type ChartConfig, ChartContainer } from "@/registry/ui/chart";
import { ChartInstanceProvider } from "@/registry/echarts-core/chart-instance-context";
import { MarkNavPlotShell } from "@/registry/echarts-core/mark-nav-plot-shell";
import { EChartsHost } from "@/registry/echarts-core/echarts-host";
import { getEcharts } from "@/registry/echarts-core/echarts-init";
import { CustomChart } from "echarts/charts";
import { PartRegistryProvider, usePartId, useRegisterPart } from "@/registry/echarts-core/part-registry";
import { compileTileColumnOption } from "@/registry/echarts-core/compile-tile-column";
import { useCompiledOption } from "@/registry/echarts-core/use-compiled-option";
import { usePartsSnapshot } from "@/registry/echarts-core/part-registry";
import {
  useChartInteraction,
  withMarkPointerCursor,
} from "@/registry/echarts-core/use-chart-interaction";
import type { ChartHandle } from "@/registry/echarts-core/chart-handle";
import type { NQMarkEvent } from "@/registry/echarts-core/nq-mark-event";
import type { TileColumnPart } from "@/registry/echarts-core/parts/types";
import type { EChartsType } from "echarts/core";
import type { ReactNode, Ref } from "react";
import { ChartTooltip } from "@/registry/ui/tooltip";

const TILE_COLUMN_ECHARTS_MODULES = [CustomChart];
getEcharts(TILE_COLUMN_ECHARTS_MODULES);

type NQTileColumnChartProps<TConfig extends Record<string, ChartConfig[string]>> = {
  config: TConfig;
  children: ReactNode;
  className?: string;
  isLoading?: boolean;
  onMarkClick?: (event: NQMarkEvent) => void;
  onChartReady?: (instance: EChartsType) => void;
  chartRef?: Ref<ChartHandle | null>;
  hoverFocus?: boolean;
};

function TileColumnChartCanvas({
  onMarkClick,
  onChartReady,
  chartRef,
  hoverFocus = true,
}: {
  onMarkClick?: (event: NQMarkEvent) => void;
  onChartReady?: (instance: EChartsType) => void;
  chartRef?: Ref<ChartHandle | null>;
  hoverFocus?: boolean;
}) {
  const { option, colorEpoch } = useCompiledOption(compileTileColumnOption, {
    data: [],
    hoverFocus,
  });
  const parts = usePartsSnapshot();
  const part = parts.find((p): p is TileColumnPart => p.type === "tileColumn");
  const categoryKey = part?.categoryKey ?? "date";
  const valueKey = part?.valueKey ?? "value";
  const rows = part?.rows ?? [];
  const { eventHandlers, onChartInstance, pointerEnabled } = useChartInteraction({
    onMarkClick,
    onChartReady,
    chartRef,
    data: rows,
    nameKey: categoryKey,
    xDataKey: categoryKey,
    valueKey,
  });
  return (
    <EChartsHost
      option={withMarkPointerCursor(option, pointerEnabled)}
      colorEpoch={colorEpoch}
      eventHandlers={eventHandlers}
      onChartInstance={onChartInstance}
      echartsModules={TILE_COLUMN_ECHARTS_MODULES}
      hoverFocus={hoverFocus}
    />
  );
}

export function NQTileColumnChart<TConfig extends Record<string, ChartConfig[string]>>({
  config,
  children,
  className,
  isLoading,
  onMarkClick,
  onChartReady,
  chartRef,
  hoverFocus = true,
}: NQTileColumnChartProps<TConfig>) {
  return (
    <PartRegistryProvider>
      <ChartInstanceProvider>
        <ChartContainer config={config} className={className} isLoading={isLoading}>
          <MarkNavPlotShell
            onMarkClick={onMarkClick}
            isLoading={isLoading}
            loadingVariant="heatmap"
            canvas={
              <TileColumnChartCanvas
                onMarkClick={onMarkClick}
                onChartReady={onChartReady}
                chartRef={chartRef}
                hoverFocus={hoverFocus}
              />
            }
          >
            {children}
          </MarkNavPlotShell>
        </ChartContainer>
      </ChartInstanceProvider>
    </PartRegistryProvider>
  );
}

export type TileColumnDatum = {
  date?: string;
  value?: number;
  [key: string]: unknown;
};

export function Tiles({
  dataKey,
  data,
  categoryKey = "date",
  valueKey = "value",
  bands,
  bandCount,
  steps,
  cellRadius,
  cellGap,
  xLabels,
  xLabelIndices,
  yTickFormatter,
}: {
  dataKey: string;
  data: TileColumnDatum[];
  categoryKey?: string;
  valueKey?: string;
  bands?: number[];
  bandCount?: number;
  steps?: string[];
  cellRadius?: number;
  cellGap?: number;
  xLabels?: string[];
  xLabelIndices?: number[];
  yTickFormatter?: (band: number) => string;
}) {
  const id = usePartId();
  useRegisterPart({
    type: "tileColumn",
    id,
    dataKey,
    rows: data,
    categoryKey,
    valueKey,
    bands,
    bandCount,
    steps,
    cellRadius,
    cellGap,
    xLabels,
    xLabelIndices,
    yTickFormatter,
  });
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
  return <ChartTooltip />;
}

export function Legend() {
  return null;
}
