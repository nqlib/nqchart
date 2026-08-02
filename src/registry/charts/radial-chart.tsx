"use client";

import { type ChartConfig, ChartContainer, getLoadingData } from "@/registry/ui/chart";
import { ChartPlotShell } from "@/registry/echarts-core/chart-plot-shell";
import { EChartsHost } from "@/registry/echarts-core/echarts-host";
import { PartRegistryProvider, usePartId, useRegisterPart } from "@/registry/echarts-core/part-registry";
import { compileRadialOption } from "@/registry/echarts-core/compile-radial";
import { segmentKeysFromData } from "@/registry/echarts-core/segment-keys";
import { useCompiledOption } from "@/registry/echarts-core/use-compiled-option";
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
import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";

/** Bucket CSS px so ResizeObserver does not recompile on every pixel. */
const VIEWPORT_BUCKET_PX = 16;

function bucketViewport(width: number, height: number) {
  const round = (n: number) => Math.max(VIEWPORT_BUCKET_PX, Math.round(n / VIEWPORT_BUCKET_PX) * VIEWPORT_BUCKET_PX);
  return { width: round(width), height: round(height) };
}

type RadialVariant = "full" | "semi";
type RadialLayout = "concentric" | "rose";

type NQRadialChartProps<
  TData extends Record<string, unknown>,
  TConfig extends Record<string, ChartConfig[string]>,
> = {
  config: TConfig;
  data: TData[];
  children: ReactNode;
  className?: string;
  nameKey?: keyof TData & string;
  variant?: RadialVariant;
  /** `concentric` (default) — arc per ring; `rose` — nightingale petals from center. */
  layout?: RadialLayout;
  innerRadius?: number | string;
  outerRadius?: number | string;
  /**
   * Polar start angle in degrees (0 = 3 o'clock, 90 = 12 o'clock).
   * Defaults: `90` for `full`, `180` for `semi`. Sweep stays full/half clockwise.
   */
  startAngle?: number;
  min?: number;
  max?: number;
  isLoading?: boolean;
};

function RadialChartCanvas<TData extends Record<string, unknown>>({
  data,
  nameKey,
  variant,
  layout,
  innerRadius,
  outerRadius,
  startAngle,
  min,
  max,
}: {
  data: TData[];
  nameKey?: string;
  variant?: RadialVariant;
  layout?: RadialLayout;
  innerRadius?: number | string;
  outerRadius?: number | string;
  startAngle?: number;
  min?: number;
  max?: number;
}) {
  const hostWrapRef = useRef<HTMLDivElement>(null);
  const [viewport, setViewport] = useState<{ width: number; height: number } | undefined>();

  useEffect(() => {
    const el = hostWrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const box = entries[0]?.contentRect;
      if (!box || box.width <= 0 || box.height <= 0) return;
      const next = bucketViewport(box.width, box.height);
      setViewport((prev) =>
        prev?.width === next.width && prev?.height === next.height ? prev : next,
      );
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const { option, colorEpoch } = useCompiledOption(compileRadialOption, {
    data,
    nameKey,
    viewport,
    radial: {
      radialVariant: variant === "semi" ? "semi" : "full",
      radialLayout: layout ?? "concentric",
      radialInnerRadius: innerRadius,
      radialOuterRadius: outerRadius,
      radialStartAngle: startAngle,
    },
  });
  return (
    <div ref={hostWrapRef} className="min-h-0 h-full w-full min-w-0 flex-1">
      <EChartsHost option={option} colorEpoch={colorEpoch} />
    </div>
  );
}

export function NQRadialChart<
  TData extends Record<string, unknown>,
  TConfig extends Record<string, ChartConfig[string]>,
>({
  config,
  data,
  children,
  className,
  nameKey,
  variant = "semi",
  layout = "concentric",
  innerRadius,
  outerRadius,
  startAngle,
  min,
  max,
  isLoading = false,
}: NQRadialChartProps<TData, TConfig>) {
  const resolvedNameKey = (nameKey ?? Object.keys(data[0] ?? {})[0] ?? "name") as string;
  const displayData = isLoading ? (getLoadingData(5) as unknown as TData[]) : data;
  const segmentKeys = useMemo(
    () => segmentKeysFromData(displayData, resolvedNameKey),
    [displayData, resolvedNameKey],
  );

  return (
    <PartRegistryProvider>
      <ChartContainer config={config} className={className} segmentKeys={segmentKeys} isLoading={isLoading}>
        <ChartPlotShell
          isLoading={isLoading}
          loadingVariant="radial"
          canvas={
            <RadialChartCanvas
              data={displayData}
              nameKey={resolvedNameKey}
              variant={variant}
              layout={layout}
              innerRadius={innerRadius}
              outerRadius={outerRadius}
              startAngle={startAngle}
              min={min}
              max={max}
            />
          }
        >
          {children}
        </ChartPlotShell>
      </ChartContainer>
    </PartRegistryProvider>
  );
}

export function RadialBar({
  dataKey,
  target,
  targetKey = "target",
  cornerRadius,
  barSize,
  showBackground,
  isClickable,
  showLabels,
}: {
  dataKey: string;
  target?: number;
  /** `chartConfig` key for target marker color/label when `target` is set. */
  targetKey?: string;
  cornerRadius?: number;
  barSize?: number;
  showBackground?: boolean;
  isClickable?: boolean;
  showLabels?: boolean;
}) {
  const id = usePartId();
  useRegisterPart(
    target != null
      ? { type: "gauge", id, dataKey, target, targetKey }
      : {
          type: "radialBar",
          id,
          dataKey,
          cornerRadius,
          barSize,
          showBackground,
          isClickable,
          showLabels,
        },
  );
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
}: {
  variant?: ChartLegendVariant;
  align?: "left" | "center" | "right";
  isClickable?: boolean;
  hideIcon?: boolean;
  className?: string;
} = {}) {
  const id = usePartId();
  useRegisterPart({ type: "legend", id, variant, align, isClickable });
  const [selected, setSelected] = useState<string | null>(null);

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
