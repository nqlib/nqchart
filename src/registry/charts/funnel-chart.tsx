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
  FunnelConeStyle,
  FunnelConnection,
  FunnelLabel,
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

export type {
  FunnelConeStyle,
  FunnelConnection,
  FunnelLabel,
  FunnelOrient,
  FunnelSort,
  FunnelTaper,
};

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
  /**
   * Optional field used only for stage *width*. Label still shows `valueKey`.
   * Stage silhouette — not a quantitative funnel. Omit to size by `valueKey`.
   */
  sizeKey?: string;
  /** Inside label format. Default `"name-value"`. */
  label?: FunnelLabel;
  isLoading?: boolean;
  /** Pixel gap between stages — overrides the `connection` preset when set. */
  stageGap?: number;
  /**
   * How stages connect visually. `pipe` = continuous S-curve ribbon;
   * `rounded` = curved trapezoid (continuous taper + rim curves + gaps;
   * custom path, default gap 8). Default stays sharp unless `cornerRadius > 0`.
   */
  connection?: FunnelConnection;
  /**
   * Width floor for the value→width scale. Soft (22%) flattens Operate ratios —
   * prefer default/steep with tapered rounded stages.
   */
  taper?: FunnelTaper;
  /**
   * Flow direction. Native / rounded default `vertical`; pipe defaults
   * `horizontal` when unset. Pipe supports both.
   */
  orient?: FunnelOrient;
  /**
   * Native / rounded stage order. Default `none` keeps `data` array order.
   * Unused for `pipe`.
   */
  sort?: FunnelSort;
  /** Pipe mode: half-width of the S-curve level-change zone in px. */
  turnRadius?: number;
  /**
   * Draw inside / pipe / rounded labels. Default true.
   */
  showLabels?: boolean;
  /**
   * Corner softness in px. Independent of `sideCurve`.
   * - `connection="rounded"`: default 11 when unset.
   * - Native (`default` / `seamless` / `segmented`): set > 0 to get real rounded
   *   stages via custom path (ECharts funnel `borderRadius` is visually weak).
   * Designers can use `cornerRadius` alone for soft trapezoids.
   */
  cornerRadius?: number;
  /**
   * Side-wall bow for soft/custom stages (0 = straight, 1 = max). Default 0.
   * Opt-in after widths are honest — ~0.15–0.25 for a subtle bow. Does not
   * replace `cornerRadius`; set both when you want radius + curve. Side-only —
   * does not break shared-edge chord/sagitta matching.
   */
  sideCurve?: number;
  /**
   * Rim curvature (0–0.2): each horizontal edge dips by `rimDepth × edgeWidth`.
   * Default 0.03 for `connection="rounded"`, else 0 (flat rims).
   */
  rimDepth?: number;
  /**
   * Radius (px) of every stage corner facing a gap. Only the funnel's outer
   * corners (top of the first stage, bottom of the last) use `cornerRadius`.
   * Default 3, clamped to `cornerRadius`.
   */
  innerCornerRadius?: number;
  /**
   * `connection="cone"` only: rim ellipse height / width — how far above the
   * funnel the viewer sits (0 = side view, max 0.5). Default 0.18.
   */
  coneTilt?: number;
  /**
   * `connection="cone"` only: `"hollow"` (default) shows the dark funnel opening
   * on the first stage; `"solid"` gives every slice a lit top face.
   */
  coneStyle?: FunnelConeStyle;
  /** Format the numeric inside-label value (still uses `valueKey`). */
  formatValue?: (value: number) => string;
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

function FunnelChartCanvas<TData extends Record<string, unknown>>({
  data,
  stageKey,
  valueKey,
  sizeKey,
  label,
  stageGap,
  connection,
  taper,
  orient,
  sort,
  turnRadius,
  showLabels,
  cornerRadius,
  sideCurve,
  rimDepth,
  innerCornerRadius,
  coneTilt,
  coneStyle,
  formatValue,
  onMarkClick,
  onChartReady,
  chartRef,
  hoverFocus = true,
}: {
  data: TData[];
  stageKey?: string;
  valueKey?: string;
  sizeKey?: string;
  label?: FunnelLabel;
  stageGap?: number;
  connection?: FunnelConnection;
  taper?: FunnelTaper;
  orient?: FunnelOrient;
  sort?: FunnelSort;
  turnRadius?: number;
  showLabels?: boolean;
  cornerRadius?: number;
  sideCurve?: number;
  rimDepth?: number;
  innerCornerRadius?: number;
  coneTilt?: number;
  coneStyle?: FunnelConeStyle;
  formatValue?: (value: number) => string;
  onMarkClick?: (event: NQMarkEvent) => void;
  onChartReady?: (instance: EChartsType) => void;
  chartRef?: Ref<ChartHandle | null>;
  hoverFocus?: boolean;
}) {
  const { option, colorEpoch } = useCompiledOption(compileFunnelOption, {
    data,
    hoverFocus,
    funnel: {
      stageKey,
      valueKey,
      sizeKey,
      label,
      stageGap,
      funnelConnection: connection,
      funnelTaper: taper,
      orient,
      sort,
      turnRadius,
      showLabels,
      cornerRadius,
      sideCurve,
      rimDepth,
      innerCornerRadius,
      coneTilt,
      coneStyle,
      formatValue,
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
      hoverFocus={hoverFocus}
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
  sizeKey,
  label,
  isLoading,
  stageGap,
  connection,
  taper,
  orient,
  sort,
  turnRadius,
  showLabels,
  cornerRadius,
  sideCurve,
  rimDepth,
  innerCornerRadius,
  coneTilt,
  coneStyle,
  formatValue,
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
                sizeKey={sizeKey}
                label={label}
                stageGap={stageGap}
                connection={connection}
                taper={taper}
                orient={orient}
                sort={sort}
                turnRadius={turnRadius}
                showLabels={showLabels}
                cornerRadius={cornerRadius}
                sideCurve={sideCurve}
                rimDepth={rimDepth}
                innerCornerRadius={innerCornerRadius}
                coneTilt={coneTilt}
                coneStyle={coneStyle}
                formatValue={formatValue}
                onMarkClick={onMarkClick}
                onChartReady={onChartReady}
                chartRef={chartRef}
                hoverFocus={hoverFocus}
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
  /**
   * Corner softness (px). Works on native + rounded. Default unset → 11 when
   * `connection="rounded"`, else 0. Independent of `sideCurve`.
   */
  cornerRadius?: number;
  /**
   * Side-wall bow (0–1, default 0). Opt-in; pair with `cornerRadius` for a soft bow.
   */
  sideCurve?: number;
  /** Rim depth as a fraction of edge width (0–0.2). Default 0.03 for rounded. */
  rimDepth?: number;
  /** Radius (px) of corners facing a gap. Default 3, clamped to `cornerRadius`. */
  innerCornerRadius?: number;
  /** Cone rim ellipse height / width (0–0.5). Default 0.18. */
  coneTilt?: number;
  /** Cone top-face look. Default `"hollow"`. */
  coneStyle?: FunnelConeStyle;
};

export function Stages(_props: StagesProps = {}) {
  const {
    connection,
    taper,
    stageGap,
    orient,
    sort,
    turnRadius,
    showLabels,
    cornerRadius,
    sideCurve,
    rimDepth,
    innerCornerRadius,
    coneTilt,
    coneStyle,
  } = _props;
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
    cornerRadius,
    sideCurve,
    rimDepth,
    innerCornerRadius,
    coneTilt,
    coneStyle,
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
