"use client";

import { useCallback, useEffect, useRef, type RefObject } from "react";
import type { EChartsOption } from "echarts";
import type { EChartsType } from "echarts/core";
import { getEcharts } from "./echarts-init";
import { maxIntroDurationMs, optionHasAnimatedSeries } from "./apply-chart-animation";
import { applyRolloutIntroReveal } from "./apply-rollout-intro";
import type { ChartPlotInsets } from "./chart-grid";
import { resetFunnelHoverFocus, scheduleFunnelHoverFocusRepair } from "./funnel-hover-focus";
import {
  isRadialRingSeriesEvent,
  resetRadialHoverFocus,
  scheduleRadialHoverFocusRepair,
} from "./radial-hover-focus";
import { repairScatterHoverFocus, resetScatterHoverFocus } from "./scatter-hover-focus";
import { resetTreemapHoverFocus, scheduleTreemapHoverFocusRepair } from "./treemap-hover-focus";
import {
  isWaterfallValuesSeriesEvent,
  resetWaterfallHoverFocus,
  scheduleWaterfallHoverFocusRepair,
} from "./waterfall-hover-focus";

// Call (don't just import) so the module registry — including the canvas renderer —
// is guaranteed in the bundle despite `sideEffects: false`. See echarts-init.ts.
const echarts = getEcharts();

export type NQChartSeriesEvent = {
  componentType?: string;
  seriesType?: string;
  dataIndex?: number;
};

export type NQChartEventHandlers = {
  onSeriesMouseOver?: (params: NQChartSeriesEvent) => void;
  onGlobalOut?: () => void;
};

/**
 * The axis-bounded plot box, measured after ECharts lays out (so `containLabel`
 * label measurement is already applied). Returns null for chart types with no
 * cartesian grid (pie, radial, sankey, …) — they have no axes to contain.
 */
function readPlotInsets(instance: EChartsType): ChartPlotInsets | null {
  const width = instance.getWidth();
  const height = instance.getHeight();
  if (width <= 0 || height <= 0) return null;

  type GridModel = {
    coordinateSystem?: {
      getRect?: () => { x: number; y: number; width: number; height: number };
    };
  };
  const inst = instance as unknown as {
    getModel(): { getComponent(name: string, idx: number): GridModel };
  };
  const gridModel = inst.getModel().getComponent("grid", 0);
  const rect = gridModel?.coordinateSystem?.getRect?.();
  if (!rect) return null;

  return {
    left: rect.x,
    right: Math.max(0, width - rect.x - rect.width),
    top: rect.y,
    bottom: Math.max(0, height - rect.y - rect.height),
  };
}

type SeriesLike = { type?: string; data?: unknown; name?: string; links?: unknown };

function seriesStructureKey(option: EChartsOption): string {
  const series = option.series
    ? (Array.isArray(option.series) ? option.series : [option.series])
    : [];
  return (series as SeriesLike[])
    .map((s) => {
      const dataLen = Array.isArray(s.data) ? s.data.length : 0;
      const linksLen = Array.isArray(s.links) ? s.links.length : 0;
      return `${s.type ?? ""}:${s.name ?? ""}:${dataLen}:${linksLen}`;
    })
    .join("|");
}

/** Skips redundant setOption when React re-renders with an identical compiled option. */
function optionStableKey(option: EChartsOption): string {
  try {
    return JSON.stringify(option.series);
  } catch {
    return seriesStructureKey(option);
  }
}

type SetOptionSizingMode = {
  notMerge?: boolean;
  replaceSeries?: boolean;
};

function setOptionWhenSized(
  instance: EChartsType,
  el: HTMLElement,
  option: EChartsOption,
  mode: SetOptionSizingMode,
  onApplied: (plotInsets: ChartPlotInsets | null) => void,
) {
  const apply = () => {
    const { width, height } = el.getBoundingClientRect();
    if (width === 0 || height === 0) {
      requestAnimationFrame(apply);
      return;
    }
    // Avoid ECharts resize() before first setOption — it attaches animation:{duration:0}
    // to the update payload and can cancel enter tweens when ResizeObserver also fires.
    if (!mode.notMerge) {
      instance.resize();
    }
    instance.setOption(option, {
      notMerge: mode.notMerge ?? false,
      lazyUpdate: false,
      replaceMerge: mode.replaceSeries ? ["series"] : undefined,
    });
    if (mode.notMerge) {
      applyRolloutIntroReveal(instance);
    }
    onApplied(readPlotInsets(instance));
  };
  apply();
}

export function useNQEcharts(
  containerRef: RefObject<HTMLDivElement | null>,
  option: EChartsOption,
  deps: unknown[] = [],
  onPlotRect?: (insets: ChartPlotInsets) => void,
  eventHandlers?: NQChartEventHandlers,
  onChartInstance?: (instance: EChartsType | null) => void,
) {
  const chartRef = useRef<EChartsType | null>(null);
  const introStartedRef = useRef(false);
  const introLockRef = useRef(false);
  const introTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingOptionRef = useRef<EChartsOption | null>(null);
  const structureKeyRef = useRef("");
  const stableKeyRef = useRef("");
  // Latest event handlers, read by ECharts listeners; written post-render.
  const eventHandlersRef = useRef(eventHandlers);
  useEffect(() => {
    eventHandlersRef.current = eventHandlers;
  });

  // Plot insets are re-read after every setOption and every ResizeObserver tick,
  // each time as a fresh object. Forwarding them verbatim re-renders the parent on
  // every paint — and since consumers position layout off these insets, that can
  // feed the ResizeObserver right back. Dedupe by value.
  const onPlotRectRef = useRef(onPlotRect);
  useEffect(() => {
    onPlotRectRef.current = onPlotRect;
  });
  const lastInsetsRef = useRef<ChartPlotInsets | null>(null);
  const reportPlotRect = useCallback((insets: ChartPlotInsets | null) => {
    if (!insets) return;
    const cb = onPlotRectRef.current;
    if (!cb) return;
    const prev = lastInsetsRef.current;
    if (
      prev &&
      prev.left === insets.left &&
      prev.right === insets.right &&
      prev.top === insets.top &&
      prev.bottom === insets.bottom
    ) {
      return;
    }
    lastInsetsRef.current = insets;
    cb(insets);
  }, []);

  const clearIntroTimer = () => {
    if (introTimerRef.current != null) {
      clearTimeout(introTimerRef.current);
      introTimerRef.current = null;
    }
  };

  const releaseIntroLock = (instance: EChartsType, el: HTMLElement) => {
    introLockRef.current = false;

    // During intro, ResizeObserver only runs getZr().resize() so enter tweens
    // aren't cancelled. Sync the full ECharts layout once the lock lifts —
    // otherwise hover/reflow mid-intro leaves the plot clipped until remount.
    instance.resize();
    reportPlotRect(readPlotInsets(instance));

    const pending = pendingOptionRef.current;
    pendingOptionRef.current = null;
    if (!pending) return;

    const pendingStableKey = optionStableKey(pending);
    if (pendingStableKey === stableKeyRef.current) return;

    const pendingKey = seriesStructureKey(pending);
    setOptionWhenSized(
      instance,
      el,
      pending,
      { replaceSeries: pendingKey !== structureKeyRef.current },
      (plotInsets) => {
        structureKeyRef.current = pendingKey;
        stableKeyRef.current = pendingStableKey;
        reportPlotRect(plotInsets);
      },
    );
  };

  const startIntroLock = (instance: EChartsType, el: HTMLElement, appliedOption: EChartsOption) => {
    const introMs = maxIntroDurationMs(appliedOption);
    if (introMs <= 0) return;

    introLockRef.current = true;
    clearIntroTimer();
    introTimerRef.current = setTimeout(() => {
      introTimerRef.current = null;
      releaseIntroLock(instance, el);
    }, introMs);
  };

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const instance = echarts.getInstanceByDom(el) ?? echarts.init(el, undefined, { renderer: "canvas" });
    chartRef.current = instance;
    onChartInstance?.(instance);

    const onMouseOver = (params: unknown) => {
      const p = params as NQChartSeriesEvent & {
        seriesIndex?: number;
        seriesName?: string;
      };
      if (p.seriesIndex != null && isRadialRingSeriesEvent(instance, p)) {
        scheduleRadialHoverFocusRepair(instance, p.seriesIndex);
      } else if (p.dataIndex != null && p.seriesIndex != null) {
        if (p.seriesType === "scatter") {
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              repairScatterHoverFocus(instance, p.seriesIndex!, p.dataIndex!);
            });
          });
        } else if (p.seriesType === "treemap") {
          scheduleTreemapHoverFocusRepair(instance, p.seriesIndex!, p.dataIndex!);
        } else if (p.seriesType === "funnel") {
          scheduleFunnelHoverFocusRepair(instance, p.seriesIndex!, p.dataIndex!);
        } else if (isWaterfallValuesSeriesEvent(p)) {
          scheduleWaterfallHoverFocusRepair(instance, p.seriesIndex!, p.dataIndex!);
        }
      }
      eventHandlersRef.current?.onSeriesMouseOver?.(params as NQChartSeriesEvent);
    };
    const onGlobalOut = () => {
      // Multi-chart pages leave append-body tooltips + axisPointers stuck unless
      // we explicitly clear them — ECharts does not always do this on globalout.
      instance.dispatchAction({ type: "hideTip" });
      instance.dispatchAction({ type: "updateAxisPointer", currTrigger: "leave" });
      resetScatterHoverFocus(instance);
      resetTreemapHoverFocus(instance);
      resetFunnelHoverFocus(instance);
      resetWaterfallHoverFocus(instance);
      resetRadialHoverFocus(instance);
      eventHandlersRef.current?.onGlobalOut?.();
    };
    instance.on("mouseover", onMouseOver);
    instance.on("globalout", onGlobalOut);

    const ro = new ResizeObserver(() => {
      // ECharts `resize()` runs an update with animation duration 0, which overrides
      // enter tweens if it fires while intro is playing. Canvas-only resize is enough.
      if (introLockRef.current) {
        instance.getZr().resize();
        return;
      }
      instance.resize();
      reportPlotRect(readPlotInsets(instance));
    });
    ro.observe(el);

    return () => {
      instance.off("mouseover", onMouseOver);
      instance.off("globalout", onGlobalOut);
      ro.disconnect();
      clearIntroTimer();
      instance.dispose();
      chartRef.current = null;
      lastInsetsRef.current = null;
      introStartedRef.current = false;
      introLockRef.current = false;
      pendingOptionRef.current = null;
      structureKeyRef.current = "";
      stableKeyRef.current = "";
      onChartInstance?.(null);
    };
  }, [containerRef, reportPlotRect, onChartInstance]);

  useEffect(() => {
    const el = containerRef.current;
    const instance = chartRef.current;
    if (!el || !instance) return;

    if (!optionHasAnimatedSeries(option)) return;

    if (introLockRef.current) {
      pendingOptionRef.current = option;
      return;
    }

    let cancelled = false;
    const frame = requestAnimationFrame(() => {
      if (cancelled) return;

      const stableKey = optionStableKey(option);
      const structureKey = seriesStructureKey(option);
      const isFirstPaint = !introStartedRef.current;

      if (!isFirstPaint && stableKey === stableKeyRef.current) return;

      const structureChanged =
        structureKeyRef.current !== "" && structureKey !== structureKeyRef.current;
      structureKeyRef.current = structureKey;
      stableKeyRef.current = stableKey;

      const replaceSeries = isFirstPaint || structureChanged;

      if (isFirstPaint) {
        introStartedRef.current = true;
        setOptionWhenSized(
          instance,
          el,
          option,
          { notMerge: true, replaceSeries: true },
          (plotInsets) => {
            startIntroLock(instance, el, option);
            reportPlotRect(plotInsets);
          },
        );
        return;
      }

      setOptionWhenSized(
        instance,
        el,
        option,
        { replaceSeries },
        (plotInsets) => {
          reportPlotRect(plotInsets);
        },
      );
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [containerRef, option, ...deps]);

  return chartRef;
}
