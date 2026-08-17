"use client";

import { type ChartConfig, ChartContainer } from "@/registry/ui/chart";
import { ChartPlotShell } from "@/registry/echarts-core/chart-plot-shell";
import { EChartsHost } from "@/registry/echarts-core/echarts-host";
import { getEcharts } from "@/registry/echarts-core/echarts-init";
import { LineChart } from "echarts/charts";
import { PartRegistryProvider, usePartId, useRegisterPart } from "@/registry/echarts-core/part-registry";
import { compileSparklineOption } from "@/registry/echarts-core/compile-sparkline";
import { useCompiledOption } from "@/registry/echarts-core/use-compiled-option";
import { ChartBackground, type BackgroundVariant } from "@/registry/ui/background";
import { ChartTooltip } from "@/registry/ui/tooltip";
import {
  useChartInteraction,
  withMarkPointerCursor,
} from "@/registry/echarts-core/use-chart-interaction";
import type { ChartHandle } from "@/registry/echarts-core/chart-handle";
import type { NQMarkEvent } from "@/registry/echarts-core/nq-mark-event";
import type { EChartsType } from "echarts/core";
import type { ReactNode, Ref } from "react";

const SPARKLINE_ECHARTS_MODULES = [LineChart];
getEcharts(SPARKLINE_ECHARTS_MODULES);

type NQSparklineChartProps<
  TData extends Record<string, unknown>,
  TConfig extends Record<string, ChartConfig[string]>,
> = {
  config: TConfig;
  data: TData[];
  children: ReactNode;
  className?: string;
  /** Field a click reports as `category`. Sparklines often have no visible axis. */
  xDataKey?: keyof TData & string;
  valueDataKey?: string;
  backgroundVariant?: BackgroundVariant;
  isLoading?: boolean;
  onMarkClick?: (event: NQMarkEvent) => void;
  onChartReady?: (instance: EChartsType) => void;
  chartRef?: Ref<ChartHandle | null>;
  /** Accepted as a no-op — sparkline is always tooltip-only. */
  hoverFocus?: boolean;
};

function SparklineChartCanvas<TData extends Record<string, unknown>>({
  data,
  xDataKey,
  valueDataKey,
  onMarkClick,
  onChartReady,
  chartRef,
  hoverFocus = true,
}: {
  data: TData[];
  xDataKey?: string;
  valueDataKey?: string;
  onMarkClick?: (event: NQMarkEvent) => void;
  onChartReady?: (instance: EChartsType) => void;
  chartRef?: Ref<ChartHandle | null>;
  hoverFocus?: boolean;
}) {
  const { option, colorEpoch } = useCompiledOption(compileSparklineOption, {
    data,
    valueDataKey,
    hoverFocus,
  });
  const { eventHandlers, onChartInstance, pointerEnabled } = useChartInteraction({
    onMarkClick,
    onChartReady,
    chartRef,
    data: data as Record<string, unknown>[],
    xDataKey,
    valueKey: valueDataKey,
  });
  return (
    <EChartsHost
      option={withMarkPointerCursor(option, pointerEnabled)}
      colorEpoch={colorEpoch}
      eventHandlers={eventHandlers}
      onChartInstance={onChartInstance}
      echartsModules={SPARKLINE_ECHARTS_MODULES}
      hoverFocus={hoverFocus}
    />
  );
}

export function NQSparklineChart<
  TData extends Record<string, unknown>,
  TConfig extends Record<string, ChartConfig[string]>,
>({
  config,
  data,
  children,
  className,
  xDataKey,
  valueDataKey = "value",
  backgroundVariant,
  isLoading,
  onMarkClick,
  onChartReady,
  chartRef,
  hoverFocus = true,
}: NQSparklineChartProps<TData, TConfig>) {
  return (
    <PartRegistryProvider>
      <ChartContainer config={config} className={className} isLoading={isLoading}>
        <ChartPlotShell
          isLoading={isLoading}
          loadingVariant="sparkline"
          canvas={
            <SparklineChartCanvas
              data={data}
              xDataKey={xDataKey}
              valueDataKey={valueDataKey}
              onMarkClick={onMarkClick}
              onChartReady={onChartReady}
              chartRef={chartRef}
              hoverFocus={hoverFocus}
            />
          }
        >
          {backgroundVariant ? <ChartBackground variant={backgroundVariant} /> : null}
          {children}
        </ChartPlotShell>
      </ChartContainer>
    </PartRegistryProvider>
  );
}

export function Fill({ dataKey }: { dataKey: string }) {
  const id = usePartId();
  useRegisterPart({ type: "sparkline", id, dataKey, showFill: true });
  return null;
}

export function Sparkline({ dataKey }: { dataKey: string }) {
  const id = usePartId();
  useRegisterPart({ type: "sparkline", id, dataKey });
  return null;
}

export function EndDot() {
  return null;
}

export { ReferenceBand } from "@/registry/echarts-core/chart-parts";

export function Tooltip() {
  return <ChartTooltip hideLabel />;
}
