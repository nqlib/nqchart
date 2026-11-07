"use client";

import type { ComponentProps } from "react";
import { ChartPlotShell } from "./chart-plot-shell";
import { useChartInstanceRef } from "./chart-instance-context";
import type { NQMarkEvent } from "./nq-mark-event";
import { useKeyboardMarkNav } from "./use-keyboard-mark-nav";

const NO_ROWS: Record<string, unknown>[] = [];
const NO_KEYS: string[] = [];

type MarkNavPlotShellProps = Omit<ComponentProps<typeof ChartPlotShell>, "canvasWrapperProps"> & {
  /** Keyboard nav is on exactly when marks are clickable — same gate as bar / pie. */
  onMarkClick?: (event: NQMarkEvent) => void;
};

/**
 * `ChartPlotShell` with `marks`-mode keyboard nav: arrows walk every painted mark
 * (radial rings, radar polygons, heatmap / calendar cells, treemap leaves, tile
 * columns), focus goes through `focusMark`, Enter re-dispatches an ECharts click so
 * the canvas's own `onMarkClick` mapping runs. Render inside a
 * `ChartInstanceProvider` — the canvas publishes its instance via
 * `useChartInteraction`.
 */
export function MarkNavPlotShell({ onMarkClick, ...shellProps }: MarkNavPlotShellProps) {
  const chartInstanceRef = useChartInstanceRef();
  const keyboardProps = useKeyboardMarkNav({
    enabled: Boolean(onMarkClick),
    mode: "marks",
    categoryCount: 0,
    seriesKeys: NO_KEYS,
    data: NO_ROWS,
    onMarkClick,
    chartInstanceRef,
  });
  return <ChartPlotShell {...shellProps} canvasWrapperProps={keyboardProps} />;
}
