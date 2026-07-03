"use client";

export type { ChartBrushRange } from "@/registry/echarts-core/use-chart-brush";
export { useChartBrush } from "@/registry/echarts-core/use-chart-brush";
export { NQChartBrush } from "@/registry/echarts-core/nq-chart-brush";

/** @deprecated Use `showBrush` on chart roots — enables the ECharts mini preview brush. */
export function NQBrush() {
  return null;
}

/** @deprecated Use `useChartBrush` instead. */
export function useNQBrush<T>({ data }: { data: T[] }) {
  return {
    visibleData: data,
    brushProps: {},
  };
}
