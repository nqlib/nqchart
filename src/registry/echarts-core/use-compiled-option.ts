"use client";

import { useMemo, useState, useEffect } from "react";
import type { EChartsOption } from "echarts";
import { useChart } from "@/registry/ui/chart";
import { createColorResolver, subscribeThemeChange } from "./resolve-chart-colors";
import { usePartsSnapshot } from "./part-registry";
import type {
  CartesianCompileConfig,
  CompileContext,
  FunnelCompileConfig,
  RadialCompileConfig,
} from "./parts/types";
import { validateDataKeys } from "./validate-data-keys";
import { withLegendFocus } from "./legend-focus";

export type CompileRootFields<TData extends Record<string, unknown> = Record<string, unknown>> = {
  data: TData[];
  xDataKey?: string;
  nameKey?: string;
  valueKey?: string;
  valueDataKey?: string;
  cartesian?: CartesianCompileConfig;
  radial?: RadialCompileConfig;
  funnel?: FunnelCompileConfig;
  viewport?: { width: number; height: number };
  hoverFocus?: boolean;
};

function buildCompileContext<TData extends Record<string, unknown>>(
  root: CompileRootFields<TData>,
  base: Pick<CompileContext<TData>, "config" | "parts" | "chartId" | "resolveColor">,
): CompileContext<TData> {
  return {
    ...base,
    data: root.data,
    xDataKey: root.xDataKey,
    nameKey: root.nameKey,
    valueKey: root.valueKey,
    valueDataKey: root.valueDataKey,
    cartesian: root.cartesian,
    radial: root.radial,
    funnel: root.funnel,
    viewport: root.viewport,
    hoverFocus: root.hoverFocus,
  };
}

export function useCompiledOption<TData extends Record<string, unknown>>(
  compile: (ctx: CompileContext<TData>) => EChartsOption,
  root: CompileRootFields<TData>,
) {
  const { config, chartId } = useChart();
  const parts = usePartsSnapshot();
  const [colorEpoch, setColorEpoch] = useState(0);

  useEffect(() => subscribeThemeChange(() => setColorEpoch((e) => e + 1)), []);

  const resolveColor = useMemo(
    () => createColorResolver(chartId, config),
    [chartId, config, colorEpoch],
  );

  const {
    data,
    xDataKey,
    nameKey,
    valueKey,
    valueDataKey,
    cartesian,
    radial,
    funnel,
    viewport,
    hoverFocus,
  } = root;

  const option = useMemo(() => {
    validateDataKeys(data, parts, xDataKey ? [xDataKey] : []);
    const ctx = buildCompileContext(
      { data, xDataKey, nameKey, valueKey, valueDataKey, cartesian, radial, funnel, viewport, hoverFocus },
      { config, parts, chartId, resolveColor },
    );
    // Applied here rather than in each compiler: every chart root funnels
    // through this hook, so legend focus lands on all of them at once and
    // cannot drift between families.
    const legend = parts.find((p) => p.type === "legend");
    return withLegendFocus(compile(ctx), legend);
  }, [
    compile,
    config,
    data,
    xDataKey,
    nameKey,
    valueKey,
    valueDataKey,
    cartesian?.layout,
    cartesian?.stackType,
    cartesian?.variant,
    cartesian?.barRadius,
    cartesian?.externalBrush,
    radial?.radialVariant,
    radial?.radialLayout,
    radial?.radialInnerRadius,
    radial?.radialOuterRadius,
    radial?.radialStartAngle,
    funnel?.stageKey,
    funnel?.valueKey,
    funnel?.stageGap,
    funnel?.funnelConnection,
    funnel?.funnelTaper,
    viewport?.width,
    viewport?.height,
    hoverFocus,
    parts,
    chartId,
    resolveColor,
  ]);

  return { option, colorEpoch };
}
