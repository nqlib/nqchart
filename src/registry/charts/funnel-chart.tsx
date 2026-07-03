"use client";

import { type ChartConfig, ChartContainer, getLoadingData } from "@/registry/ui/chart";
import { ChartPlotShell } from "@/registry/echarts-core/chart-plot-shell";
import { EChartsHost } from "@/registry/echarts-core/echarts-host";
import { PartRegistryProvider, usePartId, useRegisterPart } from "@/registry/echarts-core/part-registry";
import { compileFunnelOption } from "@/registry/echarts-core/compile-funnel";
import type { FunnelConnection, FunnelTaper } from "@/registry/echarts-core/parts/types";
import { useCompiledOption } from "@/registry/echarts-core/use-compiled-option";
import { NQChartLegend } from "@/registry/ui/legend";
import { ChartTooltip } from "@/registry/ui/tooltip";
import type { ReactNode } from "react";
import { useState } from "react";

export type { FunnelConnection, FunnelTaper };

type NQFunnelChartProps<
  TData extends Record<string, unknown>,
  TConfig extends Record<string, ChartConfig[string]>,
> = {
  config: TConfig;
  data: TData[];
  children: ReactNode;
  className?: string;
  stageKey?: string;
  valueKey?: string;
  isLoading?: boolean;
  /** Pixel gap between stages — overrides the `connection` preset when set. */
  stageGap?: number;
  /** How stages connect visually (`seamless` = no dividers). */
  connection?: FunnelConnection;
  /** How gradually stage widths taper top → bottom. */
  taper?: FunnelTaper;
};

function FunnelChartCanvas<TData extends Record<string, unknown>>({
  data,
  stageKey,
  valueKey,
  stageGap,
  connection,
  taper,
}: {
  data: TData[];
  stageKey?: string;
  valueKey?: string;
  stageGap?: number;
  connection?: FunnelConnection;
  taper?: FunnelTaper;
}) {
  const { option, colorEpoch } = useCompiledOption(compileFunnelOption, {
    data,
    funnel: {
      stageKey,
      valueKey,
      stageGap,
      funnelConnection: connection,
      funnelTaper: taper,
    },
  });
  return <EChartsHost option={option} colorEpoch={colorEpoch} />;
}

export function NQFunnelChart<
  TData extends Record<string, unknown>,
  TConfig extends Record<string, ChartConfig[string]>,
>({
  config,
  data,
  children,
  className,
  stageKey = "stage",
  valueKey = "value",
  isLoading,
  stageGap,
  connection,
  taper,
}: NQFunnelChartProps<TData, TConfig>) {
  const displayData = isLoading ? (getLoadingData(4) as unknown as TData[]) : data;
  return (
    <PartRegistryProvider>
      <ChartContainer config={config} className={className} isLoading={isLoading}>
        <ChartPlotShell
          isLoading={isLoading}
          loadingVariant="funnel"
          canvas={
            <FunnelChartCanvas
              data={displayData}
              stageKey={stageKey}
              valueKey={valueKey}
              stageGap={stageGap}
              connection={connection}
              taper={taper}
            />
          }
        >
          <RegisterFunnel stageKey={stageKey} valueKey={valueKey} />
          {children}
        </ChartPlotShell>
      </ChartContainer>
    </PartRegistryProvider>
  );
}

function RegisterFunnel({ stageKey, valueKey }: { stageKey: string; valueKey: string }) {
  const id = usePartId();
  useRegisterPart({ type: "funnel", id, stageKey, valueKey });
  return null;
}

type StagesProps = {
  isClickable?: boolean;
  connection?: FunnelConnection;
  taper?: FunnelTaper;
  stageGap?: number;
};

export function Stages(_props: StagesProps = {}) {
  const { connection, taper, stageGap } = _props;
  const id = usePartId();
  useRegisterPart({
    type: "funnelStyle",
    id,
    connection,
    taper,
    stageGap,
  });
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

export function Legend(props: { isClickable?: boolean }) {
  const id = usePartId();
  useRegisterPart({ type: "legend", id, isClickable: props.isClickable });
  const [selected, setSelected] = useState<string | null>(null);
  return (
    <NQChartLegend isClickable={props.isClickable} selected={selected} onSelectChange={setSelected} />
  );
}
