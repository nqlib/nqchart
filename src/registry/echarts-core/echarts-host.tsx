"use client";

import { useRef, useState, useEffect, useMemo } from "react";
import type { EChartsOption } from "echarts";
import { useNQEcharts, type NQChartEventHandlers } from "./use-nq-echarts";
import { subscribeThemeChange } from "./resolve-chart-colors";

type EChartsHostProps = {
  option: EChartsOption;
  className?: string;
  /** Bump when colors need re-resolve after theme toggle */
  colorEpoch?: number;
  onPlotRect?: (insets: { left: number; right: number }) => void;
  eventHandlers?: NQChartEventHandlers;
  onChartInstance?: (instance: import("echarts/core").EChartsType | null) => void;
};

export function EChartsHost({
  option,
  className,
  colorEpoch = 0,
  onPlotRect,
  eventHandlers,
  onChartInstance,
}: EChartsHostProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [themeTick, setThemeTick] = useState(0);

  useEffect(() => subscribeThemeChange(() => setThemeTick((t) => t + 1)), []);

  const mergedOption = useMemo(() => option, [option, colorEpoch, themeTick]);

  useNQEcharts(containerRef, mergedOption, [mergedOption], onPlotRect, eventHandlers, onChartInstance);

  return <div ref={containerRef} className={className ?? "min-h-0 h-full w-full min-w-0 flex-1"} />;
}
