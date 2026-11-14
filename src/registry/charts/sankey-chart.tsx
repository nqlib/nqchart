"use client";

import { type ChartConfig, ChartContainer } from "@/registry/ui/chart";
import { ChartA11yTable } from "@/registry/echarts-core/chart-a11y";
import type { ChartHandle } from "@/registry/echarts-core/chart-handle";
import {
  ChartInstanceProvider,
  useChartInstanceRef,
} from "@/registry/echarts-core/chart-instance-context";
import { ChartPlotShell } from "@/registry/echarts-core/chart-plot-shell";
import { EChartsHost } from "@/registry/echarts-core/echarts-host";
import { getEcharts } from "@/registry/echarts-core/echarts-init";
import { SankeyChart } from "echarts/charts";
import type { NQMarkEvent } from "@/registry/echarts-core/nq-mark-event";
import { PartRegistryProvider, usePartId, useRegisterPart } from "@/registry/echarts-core/part-registry";
import { compileSankeyOption, deriveSankeyGraph } from "@/registry/echarts-core/compile-sankey";
import type {
  SankeyLinkColor,
  SankeyNode,
  SankeyNodeAlign,
  SankeyOrient,
} from "@/registry/echarts-core/parts/types";
import { useCompiledOption } from "@/registry/echarts-core/use-compiled-option";
import {
  useChartInteraction,
  withMarkPointerCursor,
} from "@/registry/echarts-core/use-chart-interaction";
import { useKeyboardMarkNav } from "@/registry/echarts-core/use-keyboard-mark-nav";
import { ChartTooltip } from "@/registry/ui/tooltip";
import type { EChartsType } from "echarts/core";
import type { ComponentProps, ReactNode, Ref } from "react";
import { useMemo } from "react";

const SANKEY_ECHARTS_MODULES = [SankeyChart];
getEcharts(SANKEY_ECHARTS_MODULES);

export type { SankeyLinkColor, SankeyNode, SankeyNodeAlign, SankeyOrient };

type NQSankeyChartProps<
  TData extends Record<string, unknown>,
  TConfig extends Record<string, ChartConfig[string]>,
> = {
  /** Keyed by node name — colour + display label. Unnamed nodes take the `--chart-N` palette. */
  config: TConfig;
  /** One row per link: `sourceKey` → `targetKey` carrying `valueKey`. */
  data: TData[];
  children?: ReactNode;
  className?: string;
  /** Link source field. Default `"source"`. */
  sourceKey?: string;
  /** Link target field. Default `"target"`. */
  targetKey?: string;
  /** Link value field. Default `"value"`. */
  valueKey?: string;
  /** Explicit nodes (order + extra fields). Omit to derive them from the links. */
  nodes?: SankeyNode[];
  /** Flow direction. Default `"horizontal"` (left → right). */
  orient?: SankeyOrient;
  /** Column placement. Default `"justify"` (sinks in the last column). */
  nodeAlign?: SankeyNodeAlign;
  /** Node thickness in px. Default 12. */
  nodeWidth?: number;
  /** Space between nodes in one column in px. Default the signature stage gap (8). */
  nodeGap?: number;
  /** Node labels: name + formatted throughput. Default true. */
  showLabels?: boolean;
  /** Link fill: source node colour, or a source → target gradient. Default `"source"`. */
  linkColor?: SankeyLinkColor;
  /** Format values in labels and the tooltip. Default `toLocaleString()`. */
  formatValue?: (value: number) => string;
  isLoading?: boolean;
  onMarkClick?: (event: NQMarkEvent) => void;
  onChartReady?: (instance: EChartsType) => void;
  chartRef?: Ref<ChartHandle | null>;
  /** Hover a node → it + its links stay; hover a link → it + its two nodes. Default true. */
  hoverFocus?: boolean;
  isEmpty?: boolean;
  emptyState?: ReactNode;
  error?: ReactNode;
  a11yTable?: boolean;
  a11yLabel?: string;
  a11ySummary?: string;
};

type SankeyOptions = {
  sourceKey: string;
  targetKey: string;
  valueKey: string;
  nodes?: SankeyNode[];
  orient?: SankeyOrient;
  nodeAlign?: SankeyNodeAlign;
  nodeWidth?: number;
  nodeGap?: number;
  showLabels?: boolean;
  linkColor?: SankeyLinkColor;
  formatValue?: (value: number) => string;
};

function SankeyChartCanvas<TData extends Record<string, unknown>>({
  data,
  nodeRows,
  onMarkClick,
  onChartReady,
  chartRef,
  hoverFocus = true,
}: {
  data: TData[];
  nodeRows: Record<string, unknown>[];
  onMarkClick?: (event: NQMarkEvent) => void;
  onChartReady?: (instance: EChartsType) => void;
  chartRef?: Ref<ChartHandle | null>;
  hoverFocus?: boolean;
}) {
  const { option, colorEpoch } = useCompiledOption(compileSankeyOption, { data, hoverFocus });
  // Node and link data carry their own datum + key (compile-sankey), so a click on
  // either maps without an index lookup; `nodeRows` is the keyboard fallback.
  const { eventHandlers, onChartInstance, pointerEnabled } = useChartInteraction({
    onMarkClick,
    onChartReady,
    chartRef,
    data: nodeRows,
    nameKey: "name",
    valueKey: "value",
  });

  return (
    <EChartsHost
      option={withMarkPointerCursor(option, pointerEnabled)}
      colorEpoch={colorEpoch}
      eventHandlers={eventHandlers}
      onChartInstance={onChartInstance}
      echartsModules={SANKEY_ECHARTS_MODULES}
      hoverFocus={hoverFocus}
    />
  );
}

export function NQSankeyChart<
  TData extends Record<string, unknown>,
  TConfig extends Record<string, ChartConfig[string]>,
>({
  config,
  data,
  children,
  className,
  sourceKey = "source",
  targetKey = "target",
  valueKey = "value",
  nodes,
  orient,
  nodeAlign,
  nodeWidth,
  nodeGap,
  showLabels,
  linkColor,
  formatValue,
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
}: NQSankeyChartProps<TData, TConfig>) {
  const rows = data as Record<string, unknown>[];
  const displayData = isLoading ? ([] as TData[]) : data;
  const nodeRows = useMemo(
    () =>
      deriveSankeyGraph(rows, { sourceKey, targetKey, valueKey, nodes, nodeAlign }).nodes.map(
        (node) => ({ ...node.datum, name: node.name, value: node.value }),
      ),
    [rows, sourceKey, targetKey, valueKey, nodes, nodeAlign],
  );
  const derivedEmpty =
    isEmptyProp ?? (!isLoading && !error && Array.isArray(data) && data.length === 0);

  return (
    <PartRegistryProvider>
      <ChartInstanceProvider>
        <ChartContainer config={config} className={className} isLoading={isLoading}>
          <SankeyPlotBody
            isLoading={isLoading}
            isEmpty={derivedEmpty}
            emptyState={emptyState}
            error={error}
            a11yTable={
              a11yTable && !isLoading && !error ? (
                <ChartA11yTable
                  config={config}
                  data={rows}
                  seriesKeys={[targetKey, valueKey]}
                  categoryKey={sourceKey}
                  label={a11yLabel}
                  summary={a11ySummary}
                />
              ) : null
            }
            onMarkClick={onMarkClick}
            nodeRows={nodeRows}
            canvas={
              <SankeyChartCanvas
                data={displayData}
                nodeRows={nodeRows}
                onMarkClick={onMarkClick}
                onChartReady={onChartReady}
                chartRef={chartRef}
                hoverFocus={hoverFocus}
              />
            }
          >
            <RegisterSankey
              sourceKey={sourceKey}
              targetKey={targetKey}
              valueKey={valueKey}
              nodes={nodes}
              orient={orient}
              nodeAlign={nodeAlign}
              nodeWidth={nodeWidth}
              nodeGap={nodeGap}
              showLabels={showLabels}
              linkColor={linkColor}
              formatValue={formatValue}
            />
            {children}
          </SankeyPlotBody>
        </ChartContainer>
      </ChartInstanceProvider>
    </PartRegistryProvider>
  );
}

function SankeyPlotBody({
  children,
  canvas,
  isLoading,
  isEmpty,
  emptyState,
  error,
  a11yTable,
  onMarkClick,
  nodeRows,
}: {
  children: ReactNode;
  canvas: ReactNode;
  isLoading?: boolean;
  isEmpty?: boolean;
  emptyState?: ReactNode;
  error?: ReactNode;
  a11yTable?: ReactNode;
  onMarkClick?: (event: NQMarkEvent) => void;
  nodeRows: Record<string, unknown>[];
}) {
  const chartInstanceRef = useChartInstanceRef();
  // Arrow keys walk the nodes (series data index = node index).
  const keyboardProps = useKeyboardMarkNav({
    enabled: Boolean(onMarkClick),
    categoryCount: nodeRows.length,
    seriesKeys: ["name"],
    data: nodeRows,
    nameKey: "name",
    valueKey: "value",
    mode: "pie",
    onMarkClick,
    chartInstanceRef,
  });

  return (
    <ChartPlotShell
      isLoading={isLoading}
      loadingVariant="generic"
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

function RegisterSankey(props: SankeyOptions) {
  const id = usePartId();
  useRegisterPart({ type: "sankey", id, ...props });
  return null;
}

export function Tooltip(props: ComponentProps<typeof ChartTooltip>) {
  return <ChartTooltip {...props} />;
}
