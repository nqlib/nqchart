"use client";

import { type ChartConfig, ChartContainer, getLoadingData } from "@/registry/ui/chart";
import {
  ChartA11yTable,
  deriveSeriesKeysFromConfig,
} from "@/registry/echarts-core/chart-a11y";
import type { ChartHandle } from "@/registry/echarts-core/chart-handle";
import {
  ChartInstanceProvider,
  useChartInstanceRef,
} from "@/registry/echarts-core/chart-instance-context";
import { ChartPlotShell } from "@/registry/echarts-core/chart-plot-shell";
import { EChartsHost } from "@/registry/echarts-core/echarts-host";
import { getEcharts } from "@/registry/echarts-core/echarts-init";
import { CustomChart, FunnelChart } from "echarts/charts";
import type { NQMarkEvent } from "@/registry/echarts-core/nq-mark-event";
import { PartRegistryProvider, usePartId, useRegisterPart } from "@/registry/echarts-core/part-registry";
import { compileFunnelOption } from "@/registry/echarts-core/compile-funnel";
import type {
  FunnelConnection,
  FunnelOrient,
  FunnelSort,
  FunnelTaper,
} from "@/registry/echarts-core/parts/types";
import { useCompiledOption } from "@/registry/echarts-core/use-compiled-option";
import {
  useChartInteraction,
  withMarkPointerCursor,
} from "@/registry/echarts-core/use-chart-interaction";
import { useKeyboardMarkNav } from "@/registry/echarts-core/use-keyboard-mark-nav";
import { NQChartLegend } from "@/registry/ui/legend";
import { ChartTooltip } from "@/registry/ui/tooltip";
import type { EChartsType } from "echarts/core";
import type { ReactNode, Ref } from "react";
import { useState } from "react";

const FUNNEL_ECHARTS_MODULES = [FunnelChart, CustomChart];
getEcharts(FUNNEL_ECHARTS_MODULES);

export type { FunnelConnection, FunnelOrient, FunnelSort, FunnelTaper };

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
  /** How stages connect visually (`pipe` = smooth S-curve ribbon). */
  connection?: FunnelConnection;
  /** How gradually stage widths taper top → bottom (native funnel only). */
  taper?: FunnelTaper;
  /**
   * Flow direction. Native funnel defaults `vertical`; pipe defaults
   * `horizontal` when unset. Pipe supports both.
   */
  orient?: FunnelOrient;
  /**
   * Native funnel stage order. Default `none` keeps `data` array order.
   * Unused for `pipe`.
   */
  sort?: FunnelSort;
  /** Pipe mode: half-width of the S-curve level-change zone in px. */
  turnRadius?: number;
  /** Pipe mode: draw stage name + value above the ribbon. */
  showLabels?: boolean;
  onMarkClick?: (event: NQMarkEvent) => void;
  onChartReady?: (instance: EChartsType) => void;
  chartRef?: Ref<ChartHandle | null>;
  isEmpty?: boolean;
  emptyState?: ReactNode;
  error?: ReactNode;
  a11yTable?: boolean;
  a11yLabel?: string;
  a11ySummary?: string;
};

function FunnelChartCanvas<TData extends Record<string, unknown>>({
  data,
  stageKey,
  valueKey,
  stageGap,
  connection,
  taper,
  orient,
  sort,
  turnRadius,
  showLabels,
  onMarkClick,
  onChartReady,
  chartRef,
}: {
  data: TData[];
  stageKey?: string;
  valueKey?: string;
  stageGap?: number;
  connection?: FunnelConnection;
  taper?: FunnelTaper;
  orient?: FunnelOrient;
  sort?: FunnelSort;
  turnRadius?: number;
  showLabels?: boolean;
  onMarkClick?: (event: NQMarkEvent) => void;
  onChartReady?: (instance: EChartsType) => void;
  chartRef?: Ref<ChartHandle | null>;
}) {
  const { option, colorEpoch } = useCompiledOption(compileFunnelOption, {
    data,
    funnel: {
      stageKey,
      valueKey,
      stageGap,
      funnelConnection: connection,
      funnelTaper: taper,
      orient,
      sort,
      turnRadius,
      showLabels,
    },
  });
  const runtimeRef = useChartInstanceRef();
  const { eventHandlers, onChartInstance, pointerEnabled } = useChartInteraction({
    onMarkClick,
    onChartReady: (instance) => {
      runtimeRef.current = instance;
      onChartReady?.(instance);
    },
    chartRef,
    data: data as Record<string, unknown>[],
    nameKey: stageKey,
    valueKey,
  });

  return (
    <EChartsHost
      option={withMarkPointerCursor(option, pointerEnabled)}
      colorEpoch={colorEpoch}
      eventHandlers={eventHandlers}
      onChartInstance={onChartInstance}
      echartsModules={FUNNEL_ECHARTS_MODULES}
    />
  );
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
  orient,
  sort,
  turnRadius,
  showLabels,
  onMarkClick,
  onChartReady,
  chartRef,
  isEmpty: isEmptyProp,
  emptyState,
  error,
  a11yTable = true,
  a11yLabel,
  a11ySummary,
}: NQFunnelChartProps<TData, TConfig>) {
  const displayData = isLoading ? (getLoadingData(4) as unknown as TData[]) : data;
  const derivedEmpty =
    isEmptyProp ?? (!isLoading && !error && Array.isArray(data) && data.length === 0);
  const seriesKeys = deriveSeriesKeysFromConfig(
    config,
    data as Record<string, unknown>[],
    stageKey,
  );

  return (
    <PartRegistryProvider>
      <ChartInstanceProvider>
        <ChartContainer config={config} className={className} isLoading={isLoading}>
          <FunnelPlotBody
            isLoading={isLoading}
            isEmpty={derivedEmpty}
            emptyState={emptyState}
            error={error}
            a11yTable={
              a11yTable && !isLoading && !error ? (
                <ChartA11yTable
                  config={config}
                  data={data as Record<string, unknown>[]}
                  seriesKeys={seriesKeys.length ? seriesKeys : [valueKey]}
                  categoryKey={stageKey}
                  label={a11yLabel}
                  summary={a11ySummary}
                />
              ) : null
            }
            onMarkClick={onMarkClick}
            data={displayData as Record<string, unknown>[]}
            seriesKeys={seriesKeys}
            stageKey={stageKey}
            valueKey={valueKey}
            canvas={
              <FunnelChartCanvas
                data={displayData}
                stageKey={stageKey}
                valueKey={valueKey}
                stageGap={stageGap}
                connection={connection}
                taper={taper}
                orient={orient}
                sort={sort}
                turnRadius={turnRadius}
                showLabels={showLabels}
                onMarkClick={onMarkClick}
                onChartReady={onChartReady}
                chartRef={chartRef}
              />
            }
          >
            <RegisterFunnel stageKey={stageKey} valueKey={valueKey} />
            {children}
          </FunnelPlotBody>
        </ChartContainer>
      </ChartInstanceProvider>
    </PartRegistryProvider>
  );
}

function FunnelPlotBody({
  children,
  canvas,
  isLoading,
  isEmpty,
  emptyState,
  error,
  a11yTable,
  onMarkClick,
  data,
  seriesKeys,
  stageKey,
  valueKey,
}: {
  children: ReactNode;
  canvas: ReactNode;
  isLoading?: boolean;
  isEmpty?: boolean;
  emptyState?: ReactNode;
  error?: ReactNode;
  a11yTable?: ReactNode;
  onMarkClick?: (event: NQMarkEvent) => void;
  data: Record<string, unknown>[];
  seriesKeys: string[];
  stageKey: string;
  valueKey: string;
}) {
  const chartInstanceRef = useChartInstanceRef();
  const keyboardProps = useKeyboardMarkNav({
    enabled: Boolean(onMarkClick),
    categoryCount: data.length,
    seriesKeys: seriesKeys.length ? seriesKeys : ["value"],
    data,
    nameKey: stageKey,
    valueKey,
    mode: "pie",
    onMarkClick,
    chartInstanceRef,
  });

  return (
    <ChartPlotShell
      isLoading={isLoading}
      loadingVariant="funnel"
      canvas={canvas}
      isEmpty={isEmpty}
      emptyState={emptyState}
      error={error}
      a11yTable={a11yTable}
      canvasWrapperProps={keyboardProps}
    >
      {children}
    </ChartPlotShell>
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
  orient?: FunnelOrient;
  sort?: FunnelSort;
  turnRadius?: number;
  showLabels?: boolean;
};

export function Stages(_props: StagesProps = {}) {
  const { connection, taper, stageGap, orient, sort, turnRadius, showLabels } = _props;
  const id = usePartId();
  useRegisterPart({
    type: "funnelStyle",
    id,
    connection,
    taper,
    stageGap,
    orient,
    sort,
    turnRadius,
    showLabels,
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

export function Legend({
  isClickable,
  selected: selectedProp,
  onSelectChange,
}: {
  isClickable?: boolean;
  selected?: string | null;
  onSelectChange?: (selected: string | null) => void;
}) {
  const id = usePartId();
  const [uncontrolled, setUncontrolled] = useState<string | null>(null);
  const selected = selectedProp !== undefined ? selectedProp : uncontrolled;
  useRegisterPart({ type: "legend", id, isClickable, selected });
  const setSelected = onSelectChange ?? setUncontrolled;
  return (
    <NQChartLegend isClickable={isClickable} selected={selected} onSelectChange={setSelected} />
  );
}
