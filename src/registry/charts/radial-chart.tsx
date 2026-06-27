"use client";

import { type ChartConfig, ChartContainer, getLoadingData } from "@/registry/ui/chart";
import { ChartPlotShell } from "@/registry/echarts-core/chart-plot-shell";
import { EChartsHost } from "@/registry/echarts-core/echarts-host";
import { PartRegistryProvider, usePartId, useRegisterPart } from "@/registry/echarts-core/part-registry";
import { compileRadialOption } from "@/registry/echarts-core/compile-radial";
import { segmentKeysFromData } from "@/registry/echarts-core/segment-keys";
import { useCompiledOption } from "@/registry/echarts-core/use-compiled-option";
import {
  BeeChartLegend,
  bindChartLegendLayer,
  type ChartLegendVariant,
} from "@/registry/ui/legend";
import {
  ChartTooltip,
  type TooltipRoundness,
  type TooltipVariant,
} from "@/registry/ui/tooltip";
import { type ReactNode, useMemo, useState } from "react";

type RadialVariant = "full" | "semi";
type RadialLayout = "concentric" | "rose";

type BeeRadialChartProps<
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
  min,
  max,
}: {
  data: TData[];
  nameKey?: string;
  variant?: RadialVariant;
  layout?: RadialLayout;
  innerRadius?: number | string;
  outerRadius?: number | string;
  min?: number;
  max?: number;
}) {
  const { option, colorEpoch } = useCompiledOption(compileRadialOption, {
    data,
    nameKey,
    radial: {
      radialVariant: variant === "semi" ? "semi" : "full",
      radialLayout: layout ?? "concentric",
      radialInnerRadius: innerRadius,
      radialOuterRadius: outerRadius,
    },
  });
  return <EChartsHost option={option} colorEpoch={colorEpoch} />;
}

export function BeeRadialChart<
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
  min,
  max,
  isLoading = false,
}: BeeRadialChartProps<TData, TConfig>) {
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
  cornerRadius,
  barSize,
  showBackground,
  glowingBars,
  isClickable,
  showLabels,
}: {
  dataKey: string;
  target?: number;
  cornerRadius?: number;
  barSize?: number;
  showBackground?: boolean;
  glowingBars?: string[];
  isClickable?: boolean;
  showLabels?: boolean;
}) {
  const id = usePartId();
  useRegisterPart(
    target != null
      ? { type: "gauge", id, dataKey, target }
      : {
          type: "radialBar",
          id,
          dataKey,
          cornerRadius,
          barSize,
          showBackground,
          glowingBars,
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
    <BeeChartLegend
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
