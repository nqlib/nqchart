"use client";

import { type ChartConfig, ChartContainer } from "@/registry/ui/chart";
import { ChartPlotShell } from "@/registry/echarts-core/chart-plot-shell";
import { EChartsHost } from "@/registry/echarts-core/echarts-host";
import { getEcharts } from "@/registry/echarts-core/echarts-init";
import { HeatmapChart } from "echarts/charts";
import { CalendarComponent, VisualMapComponent } from "echarts/components";
import { PartRegistryProvider, usePartId, useRegisterPart } from "@/registry/echarts-core/part-registry";
import { compileCalendarOption } from "@/registry/echarts-core/compile-calendar";
import { useCompiledOption } from "@/registry/echarts-core/use-compiled-option";
import type { CalendarCell } from "@/registry/lib/chart-recipes";
import { usePartsSnapshot } from "@/registry/echarts-core/part-registry";
import {
  useChartInteraction,
  withMarkPointerCursor,
} from "@/registry/echarts-core/use-chart-interaction";
import type { ChartHandle } from "@/registry/echarts-core/chart-handle";
import type { NQMarkEvent } from "@/registry/echarts-core/nq-mark-event";
import type { CalendarPart } from "@/registry/echarts-core/parts/types";
import type { EChartsType } from "echarts/core";
import type { ReactNode, Ref } from "react";

const CALENDAR_ECHARTS_MODULES = [HeatmapChart, CalendarComponent, VisualMapComponent];
getEcharts(CALENDAR_ECHARTS_MODULES);

type NQCalendarChartProps<TConfig extends Record<string, ChartConfig[string]>> = {
  config: TConfig;
  children: ReactNode;
  className?: string;
  isLoading?: boolean;
  onMarkClick?: (event: NQMarkEvent) => void;
  onChartReady?: (instance: EChartsType) => void;
  chartRef?: Ref<ChartHandle | null>;
  hoverFocus?: boolean;
};

function CalendarChartCanvas({
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
  const { option, colorEpoch } = useCompiledOption(compileCalendarOption, { data: [], hoverFocus });
  // Cells live on the `<Calendar>` part rather than the root, so the rows a
  // click resolves against have to be read back out of the registry.
  const parts = usePartsSnapshot();
  const cells = (parts.find((p): p is CalendarPart => p.type === "calendar")?.cells ??
    []) as unknown as Record<string, unknown>[];
  const { eventHandlers, onChartInstance, pointerEnabled } = useChartInteraction({
    onMarkClick,
    onChartReady,
    chartRef,
    data: cells,
    // A day is identified by its date; the value is the cell's own measure.
    xDataKey: "date",
    valueKey: "value",
  });
  return (
    <EChartsHost
      option={withMarkPointerCursor(option, pointerEnabled)}
      colorEpoch={colorEpoch}
      eventHandlers={eventHandlers}
      onChartInstance={onChartInstance}
      echartsModules={CALENDAR_ECHARTS_MODULES}
      hoverFocus={hoverFocus}
    />
  );
}

export function NQCalendarChart<TConfig extends Record<string, ChartConfig[string]>>({
  config,
  children,
  className,
  isLoading,
  onMarkClick,
  onChartReady,
  chartRef,
  hoverFocus = true,
}: NQCalendarChartProps<TConfig>) {
  return (
    <PartRegistryProvider>
      <ChartContainer config={config} className={className} isLoading={isLoading}>
        <ChartPlotShell
          isLoading={isLoading}
          loadingVariant="calendar"
          canvas={
            <CalendarChartCanvas
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

export function Calendar({
  dataKey,
  data,
  range,
  min,
  max,
  cellSize,
  orient = "vertical",
  showDayLabel = true,
}: {
  dataKey: string;
  data: CalendarCell[];
  range?: string | [string, string];
  min?: number;
  max?: number;
  cellSize?: number | "auto" | (number | "auto")[];
  orient?: "horizontal" | "vertical";
  showDayLabel?: boolean;
}) {
  const id = usePartId();
  useRegisterPart({
    type: "calendar",
    id,
    dataKey,
    cells: data,
    range,
    min,
    max,
    cellSize,
    orient,
    showDayLabel,
  });
  return null;
}

export function Grid() {
  return null;
}

export function Tooltip() {
  return null;
}

export function Legend() {
  return null;
}
