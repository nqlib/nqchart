"use client";

import { useCallback, useEffect, useRef, type RefObject } from "react";
import type { EChartsOption } from "echarts";
import type { EChartsType } from "echarts/core";
import { getEcharts } from "./echarts-init";
import { maxIntroDurationMs, optionHasAnimatedSeries } from "./apply-chart-animation";
import { applyRolloutIntroReveal } from "./apply-rollout-intro";
import type { ChartPlotInsets } from "./chart-grid";
import { resetFunnelHoverFocus, scheduleFunnelHoverFocusRepair } from "./funnel-hover-focus";
import { resetPieHoverFocus, schedulePieHoverFocusRepair } from "./pie-hover-focus";
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
  seriesIndex?: number;
  seriesName?: string;
  seriesId?: string;
};

export type NQChartEventHandlers = {
  onSeriesMouseOver?: (params: NQChartSeriesEvent) => void;
  onGlobalOut?: () => void;
  /** Raw ECharts series click — map with `mapEChartsClickToMarkEvent`. */
  onSeriesClick?: (params: NQChartSeriesEvent) => void;
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
    isDisposed?: () => boolean;
    getModel(): { getComponent(name: string, idx: number): GridModel } | undefined;
  };
  // ResizeObserver can fire while empty/error/loading mounts have no model yet,
  // or after dispose races — never assume getModel() is present.
  if (inst.isDisposed?.()) return null;
  const model = inst.getModel();
  if (!model) return null;
  const gridModel = model.getComponent("grid", 0);
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

type SeriesLikeWithId = SeriesLike & { id?: string | number };

function seriesStructureKey(option: EChartsOption): string {
  const series = option.series
    ? (Array.isArray(option.series) ? option.series : [option.series])
    : [];
  return (series as SeriesLikeWithId[])
    .map((s) => {
      const dataLen = Array.isArray(s.data) ? s.data.length : 0;
      const linksLen = Array.isArray(s.links) ? s.links.length : 0;
      // Include `id` so gauge label-layout tokens (`__gauge_dial_s*_f*__`) force
      // replaceMerge — setOption merge does not reliably replace axisLabel.formatter.
      return `${s.type ?? ""}:${s.id ?? ""}:${s.name ?? ""}:${dataLen}:${linksLen}`;
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

  // Never put onChartInstance in the init-effect deps — callers often pass an
  // inline lambda (createDefaultCanvas), and plotRect → parent re-render would
  // dispose + re-init the chart (blank canvas / lost model).
  const onChartInstanceRef = useRef(onChartInstance);
  useEffect(() => {
    onChartInstanceRef.current = onChartInstance;
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

  /** Hide tip + axis cursor — ECharts often leaves these stuck after interrupted intros. */
  const clearHoverChrome = (instance: EChartsType) => {
    instance.dispatchAction({ type: "hideTip" });
    instance.dispatchAction({ type: "updateAxisPointer", currTrigger: "leave" });
    // Index-focus area/line can keep emphasis/blur after leave; downplay resets it.
    instance.dispatchAction({ type: "downplay" });
  };

  const setZrSilent = (instance: EChartsType, silent: boolean) => {
    (instance.getZr() as unknown as { silent: boolean }).silent = silent;
  };

  const releaseIntroLock = (instance: EChartsType, el: HTMLElement) => {
    introLockRef.current = false;
    // Re-enable hit-testing after the L→R enter tween finishes.
    setZrSilent(instance, false);
    clearHoverChrome(instance);

    // During intro, ResizeObserver only runs getZr().resize() so enter tweens
    // aren't cancelled. Sync the full ECharts layout once the lock lifts —
    // otherwise hover/reflow mid-intro leaves the plot clipped until remount.
    instance.resize();
    reportPlotRect(readPlotInsets(instance));

    // Snap any enter geometry that was cancelled before silent engaged (partial
    // area bands + a frozen vertical cut that looks like a stuck axisPointer).
    const current = instance.getOption() as EChartsOption;
    const series = Array.isArray(current.series)
      ? current.series
      : current.series
        ? [current.series]
        : [];
    if (series.length) {
      instance.setOption(
        {
          series: series.map((s) => ({
            ...(typeof s === "object" && s ? s : {}),
            animation: false,
            animationDuration: 0,
            animationDurationUpdate: 0,
          })),
        },
        { lazyUpdate: false },
      );
    }

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
    // AxisPointer/emphasis mid-intro cancels unfinished enter tweens and clips
    // later series at the cursor (stuck dashed line + truncated area bands).
    setZrSilent(instance, true);
    clearHoverChrome(instance);
    clearIntroTimer();
    introTimerRef.current = setTimeout(() => {
      introTimerRef.current = null;
      releaseIntroLock(instance, el);
    }, introMs);
  };

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const existing = echarts.getInstanceByDom(el);
    const instance =
      existing && !existing.isDisposed()
        ? existing
        : echarts.init(el, undefined, { renderer: "canvas" });
    chartRef.current = instance;
    onChartInstanceRef.current?.(instance);

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
        } else if (p.seriesType === "pie") {
          schedulePieHoverFocusRepair(instance, p.seriesIndex!, p.dataIndex!);
        } else if (isWaterfallValuesSeriesEvent(p)) {
          scheduleWaterfallHoverFocusRepair(instance, p.seriesIndex!, p.dataIndex!);
        }
      }
      eventHandlersRef.current?.onSeriesMouseOver?.(params as NQChartSeriesEvent);
    };
    const onGlobalOut = () => {
      // Multi-chart pages leave append-body tooltips + axisPointers stuck unless
      // we explicitly clear them — ECharts does not always do this on globalout.
      clearHoverChrome(instance);
      resetScatterHoverFocus(instance);
      resetTreemapHoverFocus(instance);
      resetFunnelHoverFocus(instance);
      resetPieHoverFocus(instance);
      resetWaterfallHoverFocus(instance);
      resetRadialHoverFocus(instance);
      eventHandlersRef.current?.onGlobalOut?.();
    };
    const onClick = (params: unknown) => {
      eventHandlersRef.current?.onSeriesClick?.(params as NQChartSeriesEvent);
    };
    instance.on("mouseover", onMouseOver);
    instance.on("globalout", onGlobalOut);
    instance.on("click", onClick);

    const ro = new ResizeObserver(() => {
      // ECharts `resize()` runs an update with animation duration 0, which overrides
      // enter tweens if it fires while intro is playing. Canvas-only resize is enough.
      if (instance.isDisposed()) return;
      const rect = el.getBoundingClientRect();
      const hasModel = (() => {
        try {
          return Boolean(
            (instance as unknown as { getModel?: () => unknown }).getModel?.(),
          );
        } catch {
          return false;
        }
      })();
      const canvas = el.querySelector("canvas");
      // Empty/error plates unmount the canvas; RO can still fire on the parent
      // before dispose settles. Resizing a model-less instance blanks the plot.
      if (!hasModel || !canvas || rect.width === 0 || rect.height === 0) return;
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
      instance.off("click", onClick);
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
      onChartInstanceRef.current?.(null);
    };
  }, [containerRef, reportPlotRect]);

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
