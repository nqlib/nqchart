"use client";

import { type ChartConfig, ChartContainer } from "@/registry/ui/chart";
import { ChartPlotShell } from "@/registry/echarts-core/chart-plot-shell";
import { EChartsHost } from "@/registry/echarts-core/echarts-host";
import { PartRegistryProvider, usePartId, useRegisterPart } from "@/registry/echarts-core/part-registry";
import { compileSparklineOption } from "@/registry/echarts-core/compile-sparkline";
import { useCompiledOption } from "@/registry/echarts-core/use-compiled-option";
import { ChartBackground, type BackgroundVariant } from "@/registry/ui/background";
import { ChartTooltip } from "@/registry/ui/tooltip";
import type { ReactNode } from "react";

type BeeSparklineChartProps<
  TData extends Record<string, unknown>,
  TConfig extends Record<string, ChartConfig[string]>,
> = {
  config: TConfig;
  data: TData[];
  children: ReactNode;
  className?: string;
  valueDataKey?: string;
  backgroundVariant?: BackgroundVariant;
  isLoading?: boolean;
};

function SparklineChartCanvas<TData extends Record<string, unknown>>({
  data,
  valueDataKey,
}: {
  data: TData[];
  valueDataKey?: string;
}) {
  const { option, colorEpoch } = useCompiledOption(compileSparklineOption, {
    data,
    valueDataKey,
  });
  return <EChartsHost option={option} colorEpoch={colorEpoch} />;
}

export function BeeSparklineChart<
  TData extends Record<string, unknown>,
  TConfig extends Record<string, ChartConfig[string]>,
>({
  config,
  data,
  children,
  className,
  valueDataKey = "value",
  backgroundVariant,
  isLoading,
}: BeeSparklineChartProps<TData, TConfig>) {
  return (
    <PartRegistryProvider>
      <ChartContainer config={config} className={className} isLoading={isLoading}>
        <ChartPlotShell
          isLoading={isLoading}
          loadingVariant="sparkline"
          canvas={<SparklineChartCanvas data={data} valueDataKey={valueDataKey} />}
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

export function ReferenceBand() {
  return null;
}

export function Tooltip() {
  return <ChartTooltip hideLabel />;
}
