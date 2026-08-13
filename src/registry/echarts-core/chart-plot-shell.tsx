"use client";

import { CHART_LEGEND_LAYER_NAME } from "@/registry/ui/legend";
import {
  ChartLoadingSkeleton,
  type ChartLoadingVariant,
} from "@/registry/ui/chart-loading-skeleton";
import {
  Children,
  cloneElement,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from "react";
import { cn } from "@/registry/lib/cn";
import type { ChartPlotInsets } from "./chart-grid";
import { ChartEmptyState, ChartErrorState } from "./chart-a11y";

function isBackgroundLayer(child: ReactNode): child is ReactElement {
  return (
    isValidElement(child) &&
    typeof child.type !== "string" &&
    (child.type as { displayName?: string }).displayName === "NQChartBackground"
  );
}

function isLegendLayer(child: ReactNode): child is ReactElement {
  return (
    isValidElement(child) &&
    typeof child.type !== "string" &&
    (child.type as { displayName?: string }).displayName === CHART_LEGEND_LAYER_NAME
  );
}

/** Layers background + ECharts canvas + HTML legend without double-mounting children. */
export function ChartPlotShell({
  canvas,
  children,
  isLoading,
  loadingVariant = "generic",
  plotRect = null,
  isEmpty,
  emptyState,
  error,
  a11yTable,
  canvasWrapperProps,
}: {
  canvas: ReactNode;
  children: ReactNode;
  isLoading?: boolean;
  loadingVariant?: ChartLoadingVariant;
  /** Measured axis-bounded plot box; forwarded to `<Background />` so it clips to it. */
  plotRect?: ChartPlotInsets | null;
  isEmpty?: boolean;
  emptyState?: ReactNode;
  error?: ReactNode;
  /** Visually hidden data table (screen reader / print fallback). */
  a11yTable?: ReactNode;
  /** Props for the focusable canvas wrapper (keyboard nav). */
  canvasWrapperProps?: React.HTMLAttributes<HTMLDivElement>;
}) {
  const childArray = Children.toArray(children);
  const legends = childArray.filter(isLegendLayer);
  const registerParts = childArray.filter(
    (child) => !isBackgroundLayer(child) && !isLegendLayer(child),
  );
  // `plotRect` is measured relative to the ECharts canvas, so the background must
  // live in the canvas box — not the outer container, whose height also includes the
  // legend and would skew `bottom`.
  const backgrounds = childArray
    .filter(isBackgroundLayer)
    .map((bg) => cloneElement(bg as ReactElement<{ plotRect?: ChartPlotInsets | null }>, { plotRect }));

  const showError = error != null && error !== false;
  const showEmpty = !showError && !isLoading && Boolean(isEmpty);

  return (
    <>
      {registerParts}
      <div className="relative flex min-h-0 flex-1 flex-col">
        <div className="relative z-[1] flex min-h-0 flex-1 flex-col">
          <div className={cn("relative min-h-0 flex-1", isLoading && "opacity-0")}>
            {backgrounds}
            <div
              className="relative z-[1] h-full w-full outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              {...canvasWrapperProps}
            >
              <div
                className="relative z-[1] h-full w-full"
                aria-hidden={a11yTable || showEmpty || showError ? true : undefined}
              >
                {showEmpty || showError ? null : canvas}
              </div>
              {showEmpty ? <ChartEmptyState>{emptyState}</ChartEmptyState> : null}
              {showError ? <ChartErrorState>{error}</ChartErrorState> : null}
            </div>
          </div>
          {isLoading ? <ChartLoadingSkeleton variant={loadingVariant} /> : null}
          {a11yTable}
          {legends}
        </div>
      </div>
    </>
  );
}
