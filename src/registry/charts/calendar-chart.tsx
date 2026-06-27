"use client";

import { type ChartConfig, ChartContainer } from "@/registry/ui/chart";
import { ChartPlotShell } from "@/registry/echarts-core/chart-plot-shell";
import { EChartsHost } from "@/registry/echarts-core/echarts-host";
import { PartRegistryProvider, usePartId, useRegisterPart } from "@/registry/echarts-core/part-registry";
import { compileCalendarOption } from "@/registry/echarts-core/compile-calendar";
import { useCompiledOption } from "@/registry/echarts-core/use-compiled-option";
import type { CalendarCell } from "@/registry/lib/chart-recipes";
import type { ReactNode } from "react";

type BeeCalendarChartProps<TConfig extends Record<string, ChartConfig[string]>> = {
  config: TConfig;
  children: ReactNode;
  className?: string;
  isLoading?: boolean;
};

function CalendarChartCanvas() {
  const { option, colorEpoch } = useCompiledOption(compileCalendarOption, { data: [] });
  return <EChartsHost option={option} colorEpoch={colorEpoch} />;
}

export function BeeCalendarChart<TConfig extends Record<string, ChartConfig[string]>>({
  config,
  children,
  className,
  isLoading,
}: BeeCalendarChartProps<TConfig>) {
  return (
    <PartRegistryProvider>
      <ChartContainer config={config} className={className} isLoading={isLoading}>
        <ChartPlotShell
          isLoading={isLoading}
          loadingVariant="calendar"
          canvas={<CalendarChartCanvas />}
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
