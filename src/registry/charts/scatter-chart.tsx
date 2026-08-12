"use client";

import { type ChartConfig, ChartContainer } from "@/registry/ui/chart";
import {
  ChartA11yTable,
  deriveSeriesKeysFromConfig,
} from "@/registry/echarts-core/chart-a11y";
import { ChartPlotShell } from "@/registry/echarts-core/chart-plot-shell";
import type { ChartPlotInsets } from "@/registry/echarts-core/chart-grid";
import { EChartsHost } from "@/registry/echarts-core/echarts-host";
import type { ChartHandle } from "@/registry/echarts-core/chart-handle";
import {
  ChartInstanceProvider,
  useChartInstanceRef,
} from "@/registry/echarts-core/chart-instance-context";
import {
  PartRegistryProvider,
  usePartId,
  usePartsSnapshot,
  useRegisterPart,
} from "@/registry/echarts-core/part-registry";
import { compileScatterOption } from "@/registry/echarts-core/compile-scatter";
import type { NQMarkEvent } from "@/registry/echarts-core/nq-mark-event";
import type { NQScale } from "@/registry/echarts-core/parts/types";
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
import { ChartTooltip } from "@/registry/ui/tooltip";
import type { EChartsType } from "echarts/core";
import type { ReactNode, Ref } from "react";
import { useMemo, useState } from "react";

const SCATTER_SERIES_META = "__seriesKey";
const SCATTER_Y_META = "__y";
const SCATTER_X_META = "__x";

type NQScatterChartProps<TConfig extends Record<string, ChartConfig[string]>> = {
  config: TConfig;
  children: ReactNode;
  className?: string;
  isLoading?: boolean;
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

function ScatterPlotBody({
  onPlotRect,
  plotRect,
  onMarkClick,
  onChartReady,
  chartRef,
  children,
  isLoading,
  isEmpty,
  emptyState,
  error,
  a11yTable,
}: {
  onPlotRect?: (insets: ChartPlotInsets) => void;
  plotRect?: ChartPlotInsets | null;
  onMarkClick?: (event: NQMarkEvent) => void;
  onChartReady?: (instance: EChartsType) => void;
  chartRef?: Ref<ChartHandle | null>;
  children: ReactNode;
  isLoading?: boolean;
  isEmpty?: boolean;
  emptyState?: ReactNode;
  error?: ReactNode;
  a11yTable?: ReactNode;
}) {
  const parts = usePartsSnapshot();
  const xKey = parts.find((p) => p.type === "xAxis")?.dataKey ?? "x";
  const yKey = parts.find((p) => p.type === "yAxis")?.dataKey ?? "y";
  const flatData = useMemo(() => {
    return parts.flatMap((p) =>
      p.type === "scatter"
        ? (p.points ?? []).map((pt) => ({
            ...pt,
            [SCATTER_SERIES_META]: p.dataKey,
            [SCATTER_X_META]: pt[xKey] ?? pt.x,
            [SCATTER_Y_META]: pt[yKey] ?? pt.y,
          }))
        : [],
    );
  }, [parts, xKey, yKey]);

  const { option, colorEpoch } = useCompiledOption(compileScatterOption, { data: [] });
  const runtimeRef = useChartInstanceRef();

  const { eventHandlers, onChartInstance, pointerEnabled } = useChartInteraction({
    onMarkClick,
    onChartReady: (instance) => {
      runtimeRef.current = instance;
      onChartReady?.(instance);
    },
    chartRef,
    data: flatData as Record<string, unknown>[],
  });

  const keyboardProps = useKeyboardMarkNav({
    enabled: Boolean(onMarkClick),
    categoryCount: flatData.length,
    seriesKeys: ["__scatter__"],
    data: flatData as Record<string, unknown>[],
    mode: "pie",
    nameKey: SCATTER_SERIES_META,
    valueKey: SCATTER_Y_META,
    xDataKey: SCATTER_X_META,
    onMarkClick,
    chartInstanceRef: runtimeRef,
  });

  return (
    <ChartPlotShell
      isLoading={isLoading}
      loadingVariant="scatter"
      plotRect={plotRect}
      isEmpty={isEmpty}
      emptyState={emptyState}
      error={error}
      a11yTable={a11yTable}
      canvasWrapperProps={keyboardProps}
      canvas={
        <EChartsHost
          option={withMarkPointerCursor(option, pointerEnabled)}
          colorEpoch={colorEpoch}
          onPlotRect={onPlotRect}
          eventHandlers={eventHandlers}
          onChartInstance={onChartInstance}
        />
      }
    >
      {children}
    </ChartPlotShell>
  );
}

function ScatterA11y({
  config,
  label,
  summary,
}: {
  config: ChartConfig;
  label?: string;
  summary?: string;
}) {
  const parts = usePartsSnapshot();
  const { data, seriesKeys, categoryKey } = useMemo(() => {
    const scatters = parts.filter((p) => p.type === "scatter");
    const keys = scatters.map((p) => (p.type === "scatter" ? p.dataKey : "")).filter(Boolean);
    const xAxisKey = parts.find((p) => p.type === "xAxis")?.dataKey ?? "x";
    const yAxisKey = parts.find((p) => p.type === "yAxis")?.dataKey ?? "y";
    const rows: Record<string, unknown>[] = [];
    for (const scatter of scatters) {
      if (scatter.type !== "scatter") continue;
      for (const pt of scatter.points ?? []) {
        const row: Record<string, unknown> = {
          [xAxisKey]: pt[xAxisKey] ?? pt.x,
        };
        row[scatter.dataKey] = pt[yAxisKey] ?? pt.y;
        rows.push(row);
      }
    }
    return {
      data: rows,
      seriesKeys: keys.length ? keys : deriveSeriesKeysFromConfig(config, rows),
      categoryKey: xAxisKey,
    };
  }, [parts, config]);

  return (
    <ChartA11yTable
      config={config}
      data={data}
      seriesKeys={seriesKeys}
      categoryKey={categoryKey}
      label={label}
      summary={summary}
    />
  );
}

export function NQScatterChart<TConfig extends Record<string, ChartConfig[string]>>({
  config,
  children,
  className,
  isLoading,
  onMarkClick,
  onChartReady,
  chartRef,
  isEmpty,
  emptyState,
  error,
  a11yTable = true,
  a11yLabel,
  a11ySummary,
}: NQScatterChartProps<TConfig>) {
  // Scatter is cartesian (x/y axes), so a composed <Background /> must clip to the
  // measured grid rect — otherwise the pattern spills past the axes.
  const [plotAlign, setPlotAlign] = useState<ChartPlotInsets | null>(null);

  return (
    <PartRegistryProvider>
      <ChartInstanceProvider>
        <ChartContainer config={config} className={className} isLoading={isLoading}>
          <ScatterPlotBody
            onPlotRect={setPlotAlign}
            plotRect={plotAlign}
            onMarkClick={onMarkClick}
            onChartReady={onChartReady}
            chartRef={chartRef}
            isLoading={isLoading}
            isEmpty={isEmpty}
            emptyState={emptyState}
            error={error}
            a11yTable={
              a11yTable && !isLoading && !error ? (
                <ScatterA11y config={config} label={a11yLabel} summary={a11ySummary} />
              ) : null
            }
          >
            {children}
          </ScatterPlotBody>
        </ChartContainer>
      </ChartInstanceProvider>
    </PartRegistryProvider>
  );
}

export function Grid() {
  const id = usePartId();
  useRegisterPart({ type: "grid", id });
  return null;
}

export function XAxis({
  dataKey,
  name,
  unit,
  tickFormatter,
  scale,
  reversed,
  labelRotate,
  labelInterval,
}: {
  dataKey?: string;
  name?: string;
  unit?: string;
  tickFormatter?: (value: unknown, index?: number) => string;
  scale?: NQScale;
  reversed?: boolean;
  labelRotate?: number;
  labelInterval?: number | "auto";
}) {
  const id = usePartId();
  useRegisterPart({
    type: "xAxis",
    id,
    dataKey: dataKey ?? "x",
    tickFormatter,
    scale,
    reversed,
    labelRotate,
    labelInterval,
  });
  void name;
  void unit;
  return null;
}

export function YAxis({
  dataKey,
  name,
  unit,
  yAxisId,
  orientation,
  domain,
  tickFormatter,
  scale,
  reversed,
  labelRotate,
  labelInterval,
}: {
  dataKey?: string;
  name?: string;
  unit?: string;
  yAxisId?: string;
  orientation?: "left" | "right";
  domain?: [number, number];
  tickFormatter?: (value: unknown, index?: number) => string;
  scale?: NQScale;
  reversed?: boolean;
  labelRotate?: number;
  labelInterval?: number | "auto";
}) {
  const id = usePartId();
  useRegisterPart({
    type: "yAxis",
    id,
    dataKey: dataKey ?? "y",
    yAxisId,
    orientation,
    domain,
    unit,
    tickFormatter,
    scale,
    reversed,
    labelRotate,
    labelInterval,
  });
  void name;
  return null;
}

export function Scatter({
  dataKey,
  data,
  variant,
  yAxisId,
}: {
  dataKey: string;
  data: Array<Record<string, number>>;
  variant?: string;
  yAxisId?: string;
}) {
  const id = usePartId();
  useRegisterPart({ type: "scatter", id, dataKey, points: data, variant, yAxisId });
  return null;
}

export function Tooltip() {
  return <ChartTooltip />;
}

export function Legend({
  variant,
  isClickable,
  align = "right",
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

export { ReferenceLine, ReferenceBand } from "@/registry/echarts-core/chart-parts";

bindChartLegendLayer(Legend);

export function Dot() {
  return null;
}

export function ActiveDot() {
  return null;
}
