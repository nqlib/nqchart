"use client";

import { type ChartConfig, ChartContainer, getLoadingData } from "@/registry/ui/chart";
import {
  ChartA11yTable,
  derivePieSeriesKeys,
} from "@/registry/echarts-core/chart-a11y";
import type { ChartHandle } from "@/registry/echarts-core/chart-handle";
import {
  ChartInstanceProvider,
  useChartInstanceRef,
} from "@/registry/echarts-core/chart-instance-context";
import { ChartPlotShell } from "@/registry/echarts-core/chart-plot-shell";
import { EChartsHost } from "@/registry/echarts-core/echarts-host";
import { getEcharts } from "@/registry/echarts-core/echarts-init";
import { PieChart } from "echarts/charts";
import type { NQMarkEvent } from "@/registry/echarts-core/nq-mark-event";
import { PartRegistryProvider, usePartId, useRegisterPart } from "@/registry/echarts-core/part-registry";
import { compilePieOption } from "@/registry/echarts-core/compile-pie";
import { segmentKeysFromData } from "@/registry/echarts-core/segment-keys";
import { useCompiledOption } from "@/registry/echarts-core/use-compiled-option";
import {
  useChartInteraction,
  withMarkPointerCursor,
} from "@/registry/echarts-core/use-chart-interaction";
import { useKeyboardMarkNav } from "@/registry/echarts-core/use-keyboard-mark-nav";
import {
  NQChartLegend,
  bindChartLegendLayer,
  type ChartLegendVariant,
} from "@/registry/ui/legend";
import {
  ChartTooltip,
  type TooltipRoundness,
  type TooltipVariant,
} from "@/registry/ui/tooltip";
import { type ReactNode, type Ref, useMemo, useState } from "react";
import type { EChartsType } from "echarts/core";

const PIE_ECHARTS_MODULES = [PieChart];
getEcharts(PIE_ECHARTS_MODULES);

type NQPieChartProps<
  TData extends Record<string, unknown>,
  TConfig extends Record<string, ChartConfig[string]>,
> = {
  config: TConfig;
  data: TData[];
  children: ReactNode;
  className?: string;
  nameKey?: keyof TData & string;
  isLoading?: boolean;
  onMarkClick?: (event: NQMarkEvent) => void;
  onChartReady?: (instance: EChartsType) => void;
  chartRef?: Ref<ChartHandle | null>;
  hoverFocus?: boolean;
  isEmpty?: boolean;
  emptyState?: ReactNode;
  error?: ReactNode;
  a11yTable?: boolean;
  a11yLabel?: string;
  a11ySummary?: string;
};

function PieChartCanvas<TData extends Record<string, unknown>>({
  data,
  nameKey,
  onMarkClick,
  onChartReady,
  chartRef,
  hoverFocus = true,
}: {
  data: TData[];
  nameKey?: string;
  onMarkClick?: (event: NQMarkEvent) => void;
  onChartReady?: (instance: EChartsType) => void;
  chartRef?: Ref<ChartHandle | null>;
  hoverFocus?: boolean;
}) {
  const { option, colorEpoch } = useCompiledOption(compilePieOption, { data, nameKey, hoverFocus });
  const runtimeRef = useChartInstanceRef();
  const { eventHandlers, onChartInstance, pointerEnabled } = useChartInteraction({
    onMarkClick,
    onChartReady,
    chartRef,
    data: data as Record<string, unknown>[],
    nameKey,
  });

  return (
    <EChartsHost
      option={withMarkPointerCursor(option, pointerEnabled)}
      colorEpoch={colorEpoch}
      eventHandlers={eventHandlers}
      onChartInstance={(instance) => {
        runtimeRef.current = instance;
        onChartInstance(instance);
      }}
      echartsModules={PIE_ECHARTS_MODULES}
      hoverFocus={hoverFocus}
    />
  );
}

export function NQPieChart<
  TData extends Record<string, unknown>,
  TConfig extends Record<string, ChartConfig[string]>,
>({
  config,
  data,
  children,
  className,
  nameKey,
  isLoading,
  onMarkClick,
  onChartReady,
  chartRef,
  hoverFocus = true,
  isEmpty: isEmptyProp,
  emptyState,
  error,
  a11yTable = true,
  a11yLabel,
  a11ySummary,
}: NQPieChartProps<TData, TConfig>) {
  const resolvedNameKey = (nameKey ?? Object.keys(data[0] ?? {})[0] ?? "name") as string;
  const displayData = isLoading ? (getLoadingData(5) as unknown as TData[]) : data;
  const segmentKeys = useMemo(
    () => segmentKeysFromData(displayData, resolvedNameKey),
    [displayData, resolvedNameKey],
  );
  const derivedEmpty =
    isEmptyProp ?? (!isLoading && !error && Array.isArray(data) && data.length === 0);
  const seriesKeys = derivePieSeriesKeys(
    data as Record<string, unknown>[],
    resolvedNameKey,
  );

  return (
    <PartRegistryProvider>
      <ChartInstanceProvider>
        <ChartContainer config={config} className={className} segmentKeys={segmentKeys} isLoading={isLoading}>
          <PiePlotBody
            isLoading={isLoading}
            canvas={
              <PieChartCanvas
                data={displayData}
                nameKey={resolvedNameKey}
                onMarkClick={onMarkClick}
                onChartReady={onChartReady}
                chartRef={chartRef}
                hoverFocus={hoverFocus}
              />
            }
            isEmpty={derivedEmpty}
            emptyState={emptyState}
            error={error}
            a11yTable={
              a11yTable && !isLoading && !error ? (
                <ChartA11yTable
                  config={config}
                  data={data as Record<string, unknown>[]}
                  seriesKeys={seriesKeys}
                  categoryKey={resolvedNameKey}
                  label={a11yLabel}
                  summary={a11ySummary}
                />
              ) : null
            }
            onMarkClick={onMarkClick}
            data={displayData as Record<string, unknown>[]}
            seriesKeys={seriesKeys}
            nameKey={resolvedNameKey}
          >
            {children}
          </PiePlotBody>
        </ChartContainer>
      </ChartInstanceProvider>
    </PartRegistryProvider>
  );
}

function PiePlotBody({
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
  nameKey,
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
  nameKey?: string;
}) {
  const chartInstanceRef = useChartInstanceRef();
  const keyboardProps = useKeyboardMarkNav({
    enabled: Boolean(onMarkClick),
    categoryCount: data.length,
    seriesKeys: seriesKeys.length ? seriesKeys : ["value"],
    data,
    xDataKey: nameKey,
    nameKey,
    mode: "pie",
    onMarkClick,
    chartInstanceRef,
  });

  return (
    <ChartPlotShell
      isLoading={isLoading}
      loadingVariant="pie"
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

export function Pie({
  dataKey,
  nameKey,
  innerRadius,
  outerRadius,
  showLabels,
}: {
  dataKey?: string;
  nameKey?: string;
  innerRadius?: number | string;
  outerRadius?: number | string;
  showLabels?: boolean;
}) {
  const id = usePartId();
  useRegisterPart({ type: "pie", id, dataKey, nameKey, innerRadius, outerRadius, showLabels });
  return null;
}

export function Tooltip({
  variant,
  roundness,
  hideLabel,
  hideIndicator,
  hide,
}: {
  variant?: TooltipVariant;
  roundness?: TooltipRoundness;
  hideLabel?: boolean;
  hideIndicator?: boolean;
  hide?: boolean;
}) {
  return (
    <ChartTooltip
      variant={variant}
      roundness={roundness}
      hideLabel={hideLabel}
      hideIndicator={hideIndicator}
      hide={hide}
    />
  );
}

export function Legend({
  variant = "rounded-square",
  align = "right",
  isClickable = false,
  hideIcon,
  className,
  selected: selectedProp,
  onSelectChange,
}: {
  variant?: ChartLegendVariant;
  align?: "left" | "center" | "right";
  isClickable?: boolean;
  hideIcon?: boolean;
  className?: string;
  selected?: string | null;
  onSelectChange?: (selected: string | null) => void;
}) {
  const id = usePartId();
  const [uncontrolled, setUncontrolled] = useState<string | null>(null);
  const selected = selectedProp !== undefined ? selectedProp : uncontrolled;
  useRegisterPart({ type: "legend", id, variant, align, isClickable, selected });
  const setSelected = onSelectChange ?? setUncontrolled;

  return (
    <NQChartLegend
      variant={variant}
      align={align}
      hideIcon={hideIcon}
      isClickable={isClickable}
      className={className}
      selected={selected}
      onSelectChange={setSelected}
    />
  );
}

bindChartLegendLayer(Legend);
