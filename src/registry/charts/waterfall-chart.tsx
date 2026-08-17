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
import { NQChartBrush } from "@/registry/echarts-core/nq-chart-brush";
import type { ChartPlotInsets } from "@/registry/echarts-core/chart-grid";
import { ChartPlotShell } from "@/registry/echarts-core/chart-plot-shell";
import { EChartsHost } from "@/registry/echarts-core/echarts-host";
import { getEcharts } from "@/registry/echarts-core/echarts-init";
import { BarChart } from "echarts/charts";
import type { NQMarkEvent } from "@/registry/echarts-core/nq-mark-event";
import { PartRegistryProvider, usePartId, useRegisterPart } from "@/registry/echarts-core/part-registry";
import { compileWaterfallOption } from "@/registry/echarts-core/compile-waterfall";
import { useChartBrush, type ChartBrushRange } from "@/registry/echarts-core/use-chart-brush";
import {
  useChartInteraction,
  withMarkPointerCursor,
} from "@/registry/echarts-core/use-chart-interaction";
import { useKeyboardMarkNav } from "@/registry/echarts-core/use-keyboard-mark-nav";
import { useCompiledOption } from "@/registry/echarts-core/use-compiled-option";
import { NQChartLegend } from "@/registry/ui/legend";
import { ChartTooltip } from "@/registry/ui/tooltip";
import type { EChartsType } from "echarts/core";
import type { ReactNode, Ref } from "react";
import { useState } from "react";

const WATERFALL_ECHARTS_MODULES = [BarChart];
getEcharts(WATERFALL_ECHARTS_MODULES);

type NQWaterfallChartProps<
  TData extends Record<string, unknown>,
  TConfig extends Record<string, ChartConfig[string]>,
> = {
  config: TConfig;
  data: TData[];
  children: ReactNode;
  className?: string;
  nameKey?: string;
  valueKey?: string;
  isLoading?: boolean;
  showBrush?: boolean;
  brushFormatLabel?: (value: unknown, index: number) => string;
  onBrushChange?: (range: ChartBrushRange) => void;
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

function WaterfallChartCanvas<TData extends Record<string, unknown>>({
  data,
  fullData,
  indexOffset = 0,
  nameKey,
  valueKey,
  externalBrush,
  onPlotRect,
  onMarkClick,
  onChartReady,
  chartRef,
  hoverFocus = true,
}: {
  data: TData[];
  fullData?: TData[];
  indexOffset?: number;
  nameKey: string;
  valueKey: string;
  externalBrush?: boolean;
  onPlotRect?: (insets: ChartPlotInsets) => void;
  onMarkClick?: (event: NQMarkEvent) => void;
  onChartReady?: (instance: EChartsType) => void;
  chartRef?: Ref<ChartHandle | null>;
  hoverFocus?: boolean;
}) {
  const { option, colorEpoch } = useCompiledOption(compileWaterfallOption, {
    data,
    nameKey,
    valueKey,
    cartesian: { externalBrush },
    hoverFocus,
  });
  const runtimeRef = useChartInstanceRef();
  const { eventHandlers, onChartInstance, pointerEnabled } = useChartInteraction({
    onMarkClick,
    onChartReady: (instance) => {
      runtimeRef.current = instance;
      onChartReady?.(instance);
    },
    chartRef,
    data: (fullData ?? data) as Record<string, unknown>[],
    xDataKey: nameKey,
    valueKey,
    indexOffset,
  });

  return (
    <EChartsHost
      option={withMarkPointerCursor(option, pointerEnabled)}
      colorEpoch={colorEpoch}
      onPlotRect={onPlotRect}
      eventHandlers={eventHandlers}
      onChartInstance={onChartInstance}
      echartsModules={WATERFALL_ECHARTS_MODULES}
      hoverFocus={hoverFocus}
    />
  );
}

export function NQWaterfallChart<
  TData extends Record<string, unknown>,
  TConfig extends Record<string, ChartConfig[string]>,
>({
  config,
  data,
  children,
  className,
  nameKey = "name",
  valueKey = "value",
  isLoading,
  showBrush = true,
  hoverFocus = true,
  brushFormatLabel,
  onBrushChange,
  onMarkClick,
  onChartReady,
  chartRef,
  isEmpty: isEmptyProp,
  emptyState,
  error,
  a11yTable = true,
  a11yLabel,
  a11ySummary,
}: NQWaterfallChartProps<TData, TConfig>) {
  const displayData = isLoading ? (getLoadingData(5) as unknown as TData[]) : data;
  const { visibleData, brushProps, range } = useChartBrush({
    data: displayData,
    minSpan: 1,
    onChange: onBrushChange,
  });
  const chartData = showBrush && !isLoading ? visibleData : displayData;
  const brushStartIndex = showBrush && !isLoading ? range.startIndex : 0;
  const externalBrush = showBrush && !isLoading;
  const [plotAlign, setPlotAlign] = useState<ChartPlotInsets | null>(null);
  const derivedEmpty =
    isEmptyProp ?? (!isLoading && !error && Array.isArray(data) && data.length === 0);
  const seriesKeys = deriveSeriesKeysFromConfig(
    config,
    data as Record<string, unknown>[],
    nameKey,
  );

  return (
    <PartRegistryProvider>
      <ChartInstanceProvider>
        <ChartContainer
          config={config}
          className={className}
          isLoading={isLoading}
          footer={
            showBrush && !isLoading ? (
              <NQChartBrush
                data={displayData}
                compile={compileWaterfallOption}
                rootFields={{ nameKey, valueKey, cartesian: { externalBrush: true } }}
                xDataKey={nameKey}
                formatLabel={brushFormatLabel}
                plotAlign={plotAlign}
                {...brushProps}
              />
            ) : undefined
          }
        >
          <WaterfallPlotBody
            isLoading={isLoading}
            isEmpty={derivedEmpty}
            emptyState={emptyState}
            error={error}
            plotRect={plotAlign}
            a11yTable={
              a11yTable && !isLoading && !error ? (
                <ChartA11yTable
                  config={config}
                  data={data as Record<string, unknown>[]}
                  seriesKeys={seriesKeys.length ? seriesKeys : [valueKey]}
                  categoryKey={nameKey}
                  label={a11yLabel}
                  summary={a11ySummary}
                />
              ) : null
            }
            onMarkClick={onMarkClick}
            data={chartData as Record<string, unknown>[]}
            fullData={displayData as Record<string, unknown>[]}
            indexOffset={brushStartIndex}
            seriesKeys={seriesKeys.length ? seriesKeys : [valueKey]}
            nameKey={nameKey}
            valueKey={valueKey}
            canvas={
              <WaterfallChartCanvas
                data={chartData}
                fullData={displayData}
                indexOffset={brushStartIndex}
                nameKey={nameKey}
                valueKey={valueKey}
                externalBrush={externalBrush}
                onPlotRect={setPlotAlign}
                onMarkClick={onMarkClick}
                onChartReady={onChartReady}
                chartRef={chartRef}
                hoverFocus={hoverFocus}
              />
            }
          >
            <RegisterWaterfall nameKey={nameKey} valueKey={valueKey} />
            {children}
          </WaterfallPlotBody>
        </ChartContainer>
      </ChartInstanceProvider>
    </PartRegistryProvider>
  );
}

function WaterfallPlotBody({
  children,
  canvas,
  isLoading,
  isEmpty,
  emptyState,
  error,
  plotRect,
  a11yTable,
  onMarkClick,
  data,
  fullData,
  indexOffset,
  seriesKeys,
  nameKey,
  valueKey,
}: {
  children: ReactNode;
  canvas: ReactNode;
  isLoading?: boolean;
  isEmpty?: boolean;
  emptyState?: ReactNode;
  error?: ReactNode;
  plotRect?: ChartPlotInsets | null;
  a11yTable?: ReactNode;
  onMarkClick?: (event: NQMarkEvent) => void;
  data: Record<string, unknown>[];
  fullData: Record<string, unknown>[];
  indexOffset: number;
  seriesKeys: string[];
  nameKey: string;
  valueKey: string;
}) {
  const chartInstanceRef = useChartInstanceRef();
  const keyboardProps = useKeyboardMarkNav({
    enabled: Boolean(onMarkClick),
    categoryCount: data.length,
    seriesKeys,
    data,
    fullData,
    indexOffset,
    xDataKey: nameKey,
    valueKey,
    onMarkClick,
    chartInstanceRef,
  });

  return (
    <ChartPlotShell
      isLoading={isLoading}
      loadingVariant="waterfall"
      plotRect={plotRect}
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

function RegisterWaterfall({
  nameKey,
  valueKey,
}: {
  nameKey: string;
  valueKey: string;
}) {
  const id = usePartId();
  useRegisterPart({ type: "waterfall", id, nameKey, valueKey, typeKey: "type" });
  return null;
}

export function Bars() {
  return null;
}

export function Grid() {
  const id = usePartId();
  useRegisterPart({ type: "grid", id });
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
