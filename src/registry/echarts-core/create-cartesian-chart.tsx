"use client";

import { type ChartConfig, ChartContainer, getLoadingData } from "@/registry/ui/chart";
import { NQChartBrush } from "@/registry/echarts-core/nq-chart-brush";
import type { ChartPlotInsets } from "@/registry/echarts-core/chart-grid";
import { ChartPlotShell } from "@/registry/echarts-core/chart-plot-shell";
import { EChartsHost } from "@/registry/echarts-core/echarts-host";
import { PartRegistryProvider } from "@/registry/echarts-core/part-registry";
import { useChartBrush, type ChartBrushRange } from "@/registry/echarts-core/use-chart-brush";
import { useCompiledOption, type CompileRootFields } from "@/registry/echarts-core/use-compiled-option";
import type { CompileContext } from "@/registry/echarts-core/parts/types";
import type { ChartLoadingVariant } from "@/registry/ui/chart-loading-skeleton";
import type { EChartsOption } from "echarts";
import type { EChartsType } from "echarts/core";
import { type ReactNode, type Ref, useCallback, useState } from "react";
import {
  ChartA11yTable,
  deriveSeriesKeysFromConfig,
} from "./chart-a11y";
import type { ChartHandle } from "./chart-handle";
import {
  ChartInstanceProvider,
  useChartInstanceRef,
} from "./chart-instance-context";
import type { NQMarkEvent } from "./nq-mark-event";
import {
  useChartInteraction,
  withMarkPointerCursor,
} from "./use-chart-interaction";
import { useKeyboardMarkNav } from "./use-keyboard-mark-nav";

export type CartesianChartBaseProps<
  TData extends Record<string, unknown>,
  TConfig extends Record<string, ChartConfig[string]>,
> = {
  config: TConfig;
  data: TData[];
  children: ReactNode;
  className?: string;
  xDataKey?: keyof TData & string;
  isLoading?: boolean;
  showBrush?: boolean;
  brushFormatLabel?: (value: unknown, index: number) => string;
  onMarkClick?: (event: NQMarkEvent) => void;
  onBrushChange?: (range: ChartBrushRange) => void;
  /**
   * Escape hatch — unsupported surface. Prefer typed props; using this opts out
   * of API stability for anything you call on the instance.
   */
  onChartReady?: (instance: EChartsType) => void;
  chartRef?: Ref<ChartHandle | null>;
  isEmpty?: boolean;
  emptyState?: ReactNode;
  error?: ReactNode;
  /** Visually hidden data table. Default true. */
  a11yTable?: boolean;
  a11yLabel?: string;
  a11ySummary?: string;
};

export type CartesianPlotRectState = {
  plotAlign: ChartPlotInsets | null;
  onPlotRect: (insets: ChartPlotInsets) => void;
  canvasProps: Record<string, unknown>;
};

export type CartesianShellState<TData extends Record<string, unknown>> = {
  /** Visible rows (brush window) — feed the compiler / canvas plot. */
  chartData: TData[];
  /** Full display rows — mark events use absolute indices into this array. */
  fullData: TData[];
  /** Brush window start; added to ECharts dataIndex for absolute row index. */
  brushStartIndex: number;
  xKey: string | undefined;
  externalBrush: boolean;
  onPlotRect: (insets: ChartPlotInsets) => void;
  canvasProps: Record<string, unknown>;
  onMarkClick?: (event: NQMarkEvent) => void;
  onChartReady?: (instance: EChartsType) => void;
  chartRef?: Ref<ChartHandle | null>;
};

type CreateCartesianChartConfig<
  TData extends Record<string, unknown>,
  TConfig extends Record<string, ChartConfig[string]>,
  TChartProps extends CartesianChartBaseProps<TData, TConfig>,
  TCanvasProps extends Record<string, unknown>,
> = {
  displayName: string;
  compile: (ctx: CompileContext<TData>) => EChartsOption;
  loadingVariant: ChartLoadingVariant;
  defaultLoadingPoints?: number;
  defaults?: Partial<TChartProps>;
  getRootFields: (
    props: TChartProps,
    xKey: string | undefined,
  ) => Omit<CompileRootFields<TData>, "data">;
  mapCanvasProps: (props: TChartProps, shell: CartesianShellState<TData>) => TCanvasProps;
  getCompileRoot?: (canvasProps: TCanvasProps) => CompileRootFields<TData>;
  Canvas?: React.ComponentType<TCanvasProps>;
  usePlotRectState?: () => CartesianPlotRectState;
  getLoadingPoints?: (props: TChartProps) => number;
};

function useDefaultPlotRectState(): CartesianPlotRectState {
  const [plotAlign, setPlotAlign] = useState<ChartPlotInsets | null>(null);
  return { plotAlign, onPlotRect: setPlotAlign, canvasProps: {} };
}

function createDefaultCanvas<TData extends Record<string, unknown>, TCanvasProps extends Record<string, unknown>>(
  compile: (ctx: CompileContext<TData>) => EChartsOption,
  getCompileRoot: (canvasProps: TCanvasProps) => CompileRootFields<TData>,
) {
  return function DefaultCartesianCanvas(canvasProps: TCanvasProps) {
    const compileRoot = getCompileRoot(canvasProps);
    const { option, colorEpoch } = useCompiledOption(compile, compileRoot);
    const onPlotRect = (canvasProps as { onPlotRect?: (insets: ChartPlotInsets) => void }).onPlotRect;
    const onMarkClick = (canvasProps as { onMarkClick?: (e: NQMarkEvent) => void }).onMarkClick;
    const onChartReady = (canvasProps as { onChartReady?: (i: EChartsType) => void }).onChartReady;
    const chartRef = (canvasProps as { chartRef?: Ref<ChartHandle | null> }).chartRef;
    const data = (canvasProps as { data?: TData[] }).data ?? [];
    const fullData =
      (canvasProps as { fullData?: TData[] }).fullData ?? data;
    const indexOffset = (canvasProps as { indexOffset?: number }).indexOffset ?? 0;
    const xDataKey = (canvasProps as { xDataKey?: string }).xDataKey;
    const runtimeRef = useChartInstanceRef();

    const { eventHandlers, onChartInstance, pointerEnabled } = useChartInteraction({
      onMarkClick,
      onChartReady: (instance) => {
        runtimeRef.current = instance;
        onChartReady?.(instance);
      },
      chartRef,
      data: fullData as Record<string, unknown>[],
      xDataKey,
      indexOffset,
    });

    // Stable identity — inline lambdas re-triggered useNQEcharts init (dispose thrash).
    const handleChartInstance = useCallback(
      (instance: EChartsType | null) => {
        runtimeRef.current = instance;
        onChartInstance(instance);
      },
      [onChartInstance, runtimeRef],
    );

    const painted = withMarkPointerCursor(option, pointerEnabled);

    return (
      <EChartsHost
        option={painted}
        colorEpoch={colorEpoch}
        onPlotRect={onPlotRect}
        eventHandlers={eventHandlers}
        onChartInstance={handleChartInstance}
      />
    );
  };
}

export function createCartesianChart<
  TData extends Record<string, unknown>,
  TConfig extends Record<string, ChartConfig[string]>,
  TChartProps extends CartesianChartBaseProps<TData, TConfig> = CartesianChartBaseProps<TData, TConfig>,
  TCanvasProps extends Record<string, unknown> = {
    data: TData[];
    xDataKey?: string;
    externalBrush?: boolean;
    onPlotRect?: (insets: ChartPlotInsets) => void;
  },
>(config: CreateCartesianChartConfig<TData, TConfig, TChartProps, TCanvasProps>) {
  const {
    displayName,
    compile,
    loadingVariant,
    defaultLoadingPoints = 12,
    defaults,
    getRootFields,
    mapCanvasProps,
    getCompileRoot,
    Canvas: CustomCanvas,
    usePlotRectState = useDefaultPlotRectState,
    getLoadingPoints,
  } = config;

  const Canvas =
    CustomCanvas ??
    (getCompileRoot
      ? createDefaultCanvas<TData, TCanvasProps>(compile, getCompileRoot)
      : (() => {
          throw new Error(`${displayName}: getCompileRoot is required when Canvas is omitted`);
        }) as React.ComponentType<TCanvasProps>);

  function CartesianChart(props: TChartProps) {
    const merged = { ...defaults, ...props } as TChartProps;
    const {
      config: chartConfig,
      data,
      children,
      className,
      xDataKey,
      isLoading = false,
      showBrush = true,
      brushFormatLabel,
      onMarkClick,
      onBrushChange,
      onChartReady,
      chartRef,
      isEmpty: isEmptyProp,
      emptyState,
      error,
      a11yTable = true,
      a11yLabel,
      a11ySummary,
    } = merged;

    const loadingPoints = getLoadingPoints?.(merged) ?? defaultLoadingPoints;
    const displayData = isLoading
      ? (getLoadingData(loadingPoints) as unknown as TData[])
      : data;
    const { visibleData, brushProps, range } = useChartBrush({
      data: displayData,
      onChange: onBrushChange,
    });
    const xKey = xDataKey as string | undefined;
    const chartData = showBrush && !isLoading ? visibleData : displayData;
    const brushStartIndex = showBrush && !isLoading ? range.startIndex : 0;
    const externalBrush = showBrush && !isLoading;
    const { plotAlign, onPlotRect, canvasProps } = usePlotRectState();
    const rootFields = getRootFields(merged, xKey);
    const brushRootFields =
      rootFields.cartesian?.layout === "horizontal"
        ? {
            ...rootFields,
            cartesian: {
              ...rootFields.cartesian,
              layout: "vertical" as const,
            },
          }
        : rootFields;

    const canvasElementProps = mapCanvasProps(merged, {
      chartData,
      fullData: displayData,
      brushStartIndex,
      xKey,
      externalBrush,
      onPlotRect,
      canvasProps,
      onMarkClick,
      onChartReady,
      chartRef,
    });

    const derivedEmpty =
      isEmptyProp ?? (!isLoading && !error && Array.isArray(data) && data.length === 0);
    const seriesKeys = deriveSeriesKeysFromConfig(
      chartConfig,
      data as Record<string, unknown>[],
      xKey,
    );

    return (
      <PartRegistryProvider>
        <ChartInstanceProvider>
          <ChartContainer
            config={chartConfig}
            className={className}
            isLoading={isLoading}
            footer={
              showBrush && !isLoading ? (
                <NQChartBrush
                  data={displayData}
                  compile={compile}
                  rootFields={brushRootFields}
                  xDataKey={xKey}
                  formatLabel={brushFormatLabel}
                  plotAlign={plotAlign}
                  {...brushProps}
                />
              ) : undefined
            }
          >
            <CartesianPlotBody
              isLoading={isLoading}
              loadingVariant={loadingVariant}
              plotAlign={plotAlign}
              canvas={<Canvas {...canvasElementProps} />}
              isEmpty={derivedEmpty}
              emptyState={emptyState}
              error={error}
              a11yTable={
                a11yTable && !isLoading && !error ? (
                  <ChartA11yTable
                    config={chartConfig}
                    data={data as Record<string, unknown>[]}
                    seriesKeys={seriesKeys}
                    categoryKey={xKey}
                    label={a11yLabel}
                    summary={a11ySummary}
                  />
                ) : null
              }
              onMarkClick={onMarkClick}
              data={chartData as Record<string, unknown>[]}
              fullData={displayData as Record<string, unknown>[]}
              seriesKeys={seriesKeys}
              xDataKey={xKey}
              indexOffset={brushStartIndex}
            >
              {children}
            </CartesianPlotBody>
          </ChartContainer>
        </ChartInstanceProvider>
      </PartRegistryProvider>
    );
  }

  CartesianChart.displayName = displayName;
  return { Chart: CartesianChart };
}

function CartesianPlotBody({
  children,
  canvas,
  isLoading,
  loadingVariant,
  plotAlign,
  isEmpty,
  emptyState,
  error,
  a11yTable,
  onMarkClick,
  data,
  fullData,
  seriesKeys,
  xDataKey,
  indexOffset = 0,
}: {
  children: ReactNode;
  canvas: ReactNode;
  isLoading?: boolean;
  loadingVariant: ChartLoadingVariant;
  plotAlign: ChartPlotInsets | null;
  isEmpty?: boolean;
  emptyState?: ReactNode;
  error?: ReactNode;
  a11yTable?: ReactNode;
  onMarkClick?: (event: NQMarkEvent) => void;
  data: Record<string, unknown>[];
  fullData?: Record<string, unknown>[];
  seriesKeys: string[];
  xDataKey?: string;
  indexOffset?: number;
}) {
  const chartInstanceRef = useChartInstanceRef();
  const keyboardProps = useKeyboardMarkNav({
    enabled: Boolean(onMarkClick),
    categoryCount: data.length,
    seriesKeys,
    data,
    fullData,
    xDataKey,
    onMarkClick,
    chartInstanceRef,
    indexOffset,
  });

  return (
    <ChartPlotShell
      isLoading={isLoading}
      loadingVariant={loadingVariant}
      plotRect={plotAlign}
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
