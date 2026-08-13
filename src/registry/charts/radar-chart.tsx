"use client";

import { type ChartConfig, ChartContainer, getLoadingData } from "@/registry/ui/chart";
import { ChartPlotShell } from "@/registry/echarts-core/chart-plot-shell";
import { EChartsHost } from "@/registry/echarts-core/echarts-host";
import { getEcharts } from "@/registry/echarts-core/echarts-init";
import { RadarChart } from "echarts/charts";
import { PolarComponent, RadarComponent } from "echarts/components";
import { PartRegistryProvider, usePartId, useRegisterPart } from "@/registry/echarts-core/part-registry";
import { compileRadarOption } from "@/registry/echarts-core/compile-radar";
import { useCompiledOption } from "@/registry/echarts-core/use-compiled-option";
import {
  NQChartLegend,
  bindChartLegendLayer,
  type ChartLegendVariant,
} from "@/registry/ui/legend";
import { ChartTooltip } from "@/registry/ui/tooltip";
import { usePartsSnapshot } from "@/registry/echarts-core/part-registry";
import {
  useChartInteraction,
  withMarkPointerCursor,
} from "@/registry/echarts-core/use-chart-interaction";
import type { ChartHandle } from "@/registry/echarts-core/chart-handle";
import type { NQMarkEvent } from "@/registry/echarts-core/nq-mark-event";
import type { PolarAngleAxisPart } from "@/registry/echarts-core/parts/types";
import type { EChartsType } from "echarts/core";
import type { ReactNode, Ref } from "react";
import { useState } from "react";

const RADAR_ECHARTS_MODULES = [RadarChart, RadarComponent, PolarComponent];
getEcharts(RADAR_ECHARTS_MODULES);

type NQRadarChartProps<
  TData extends Record<string, unknown>,
  TConfig extends Record<string, ChartConfig[string]>,
> = {
  config: TConfig;
  data: TData[];
  children: ReactNode;
  className?: string;
  isLoading?: boolean;
  onMarkClick?: (event: NQMarkEvent) => void;
  onChartReady?: (instance: EChartsType) => void;
  chartRef?: Ref<ChartHandle | null>;
};

function RadarChartCanvas<TData extends Record<string, unknown>>({
  data,
  onMarkClick,
  onChartReady,
  chartRef,
}: {
  data: TData[];
  onMarkClick?: (event: NQMarkEvent) => void;
  onChartReady?: (instance: EChartsType) => void;
  chartRef?: Ref<ChartHandle | null>;
}) {
  const { option, colorEpoch } = useCompiledOption(compileRadarOption, { data });
  const parts = usePartsSnapshot();
  const angleKey = parts.find(
    (p): p is PolarAngleAxisPart => p.type === "polarAngleAxis",
  )?.dataKey;
  /*
   * ECharts reports a radar click at series level — it does not say which spoke
   * was nearest — so `category` is the angle-axis field of the clicked row and
   * `seriesKey` is the series' dataKey. Consumers wanting a single axis should
   * read `datum`, which carries the whole row.
   */
  const { eventHandlers, onChartInstance, pointerEnabled } = useChartInteraction({
    onMarkClick,
    onChartReady,
    chartRef,
    data: data as Record<string, unknown>[],
    xDataKey: angleKey,
  });
  return (
    <EChartsHost
      option={withMarkPointerCursor(option, pointerEnabled)}
      colorEpoch={colorEpoch}
      eventHandlers={eventHandlers}
      onChartInstance={onChartInstance}
      echartsModules={RADAR_ECHARTS_MODULES}
    />
  );
}

export function NQRadarChart<
  TData extends Record<string, unknown>,
  TConfig extends Record<string, ChartConfig[string]>,
>({
  config,
  data,
  children,
  className,
  isLoading,
  onMarkClick,
  onChartReady,
  chartRef,
}: NQRadarChartProps<TData, TConfig>) {
  const displayData = isLoading ? (getLoadingData(6) as unknown as TData[]) : data;
  return (
    <PartRegistryProvider>
      <ChartContainer config={config} className={className} isLoading={isLoading}>
        <ChartPlotShell
          isLoading={isLoading}
          loadingVariant="radar"
          canvas={
            <RadarChartCanvas
              data={displayData}
              onMarkClick={onMarkClick}
              onChartReady={onChartReady}
              chartRef={chartRef}
            />
          }
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

export function Legend({
  variant,
  isClickable,
  align,
  hideIcon,
  className,
  selected: selectedProp,
  onSelectChange,
}: {
  variant?: ChartLegendVariant;
  isClickable?: boolean;
  align?: "left" | "center" | "right";
  hideIcon?: boolean;
  className?: string;
  selected?: string | null;
  onSelectChange?: (selected: string | null) => void;
}) {
  const id = usePartId();
  const [uncontrolled, setUncontrolled] = useState<string | null>(null);
  const selected = selectedProp !== undefined ? selectedProp : uncontrolled;
  useRegisterPart({ type: "legend", id, variant, isClickable, align, selected });
  const setSelected = onSelectChange ?? setUncontrolled;
  return (
    <NQChartLegend
      variant={variant}
      isClickable={isClickable}
      align={align}
      hideIcon={hideIcon}
      className={className}
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
