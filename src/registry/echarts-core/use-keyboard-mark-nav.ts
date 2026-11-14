"use client";

/**
 * Keyboard navigation for chart marks — arrows move focus; Enter fires onMarkClick.
 * Focus is applied through `focusMark` (hover-focus-repair.ts) — the same path as
 * pointer hover — so keyboard focus looks identical to hovering the mark.
 */

import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent, type RefObject } from "react";
import type { EChartsType } from "echarts/core";
import {
  clearFocus,
  focusMark,
  listFocusTargets,
  markParamsAt,
  type FocusTarget,
} from "./hover-focus-repair";
import type { NQMarkEvent } from "./nq-mark-event";

export type KeyboardMarkNavOpts = {
  enabled: boolean;
  categoryCount: number;
  seriesKeys: string[];
  /** Rows aligned with the painted series (brush window when brushing). */
  data: Record<string, unknown>[];
  /**
   * Absolute rows for event.datum / event.index. Defaults to `data`.
   * When brushing, pass the full display array and set `indexOffset`.
   */
  fullData?: Record<string, unknown>[];
  xDataKey?: string;
  onMarkClick?: (event: NQMarkEvent) => void;
  chartInstanceRef: RefObject<EChartsType | null>;
  /** Absolute index = focus.category + indexOffset. */
  indexOffset?: number;
  /**
   * `cartesian` (default): arrows move category × series.
   * `pie`: one series; arrows only move slice index; seriesKey from nameKey.
   * `marks`: arrows walk every painted mark in the chart instance (radial rings,
   *   radar polygons, heatmap / calendar cells, treemap leaves, tile columns);
   *   Enter re-dispatches an ECharts `click`, so it maps exactly like a pointer click.
   */
  mode?: "cartesian" | "pie" | "marks";
  nameKey?: string;
  valueKey?: string;
  /**
   * Cartesian only: ECharts series index for a series position. Waterfall passes
   * the `__wf_values__` index — series 0 is the silent stack placeholder.
   */
  resolveSeriesIndex?: (instance: EChartsType, seriesPosition: number) => number;
};

/** The ECharts mark a keyboard focus position addresses (null when it has none). */
export function resolveKeyboardTarget(
  instance: EChartsType,
  mode: NonNullable<KeyboardMarkNavOpts["mode"]>,
  focus: { category: number; series: number },
  resolveSeriesIndex?: KeyboardMarkNavOpts["resolveSeriesIndex"],
): FocusTarget | null {
  if (mode === "marks") return listFocusTargets(instance)[focus.category] ?? null;
  if (mode === "pie") return { seriesIndex: 0, dataIndex: focus.category };
  const seriesIndex = resolveSeriesIndex?.(instance, focus.series) ?? focus.series;
  if (seriesIndex < 0) return null;
  return { seriesIndex, dataIndex: focus.category };
}

function isLive(instance: EChartsType | null): instance is EChartsType {
  return instance != null && !(instance as { isDisposed?(): boolean }).isDisposed?.();
}

export function useKeyboardMarkNav({
  enabled,
  categoryCount,
  seriesKeys,
  data,
  fullData,
  xDataKey,
  onMarkClick,
  chartInstanceRef,
  indexOffset = 0,
  mode = "cartesian",
  nameKey,
  valueKey = "value",
  resolveSeriesIndex,
}: KeyboardMarkNavOpts) {
  const [focus, setFocus] = useState<{ category: number; series: number } | null>(null);
  const activeFocus = enabled ? focus : null;
  const effectiveSeriesKeys = useMemo(
    () => (mode === "pie" ? ["__pie__"] : mode === "marks" ? ["__marks__"] : seriesKeys),
    [mode, seriesKeys],
  );
  const absoluteRows = fullData ?? data;

  // Latest resolver without re-running the focus effect on every render.
  const resolveRef = useRef(resolveSeriesIndex);
  useEffect(() => {
    resolveRef.current = resolveSeriesIndex;
  });

  const targetFor = useCallback(
    (instance: EChartsType, f: { category: number; series: number }) =>
      resolveKeyboardTarget(instance, mode, f, resolveRef.current),
    [mode],
  );

  // Keyboard focus goes through the same `focusMark` as pointer hover, so the
  // repair families (pie, funnel, treemap, waterfall, scatter, radial) visibly
  // focus and `hoverFocus={false}` skips the dim (the tooltip still shows).
  const focusedOnRef = useRef<EChartsType | null>(null);
  useEffect(() => {
    const instance = chartInstanceRef.current;
    if (activeFocus == null) {
      const prev = focusedOnRef.current;
      focusedOnRef.current = null;
      if (isLive(prev)) clearFocus(prev, "keyboard");
      return;
    }
    if (!isLive(instance)) return;
    const target = targetFor(instance, activeFocus);
    if (!target) return;
    focusMark(instance, target, "keyboard");
    focusedOnRef.current = instance;
  }, [activeFocus, chartInstanceRef, targetFor]);

  useEffect(() => {
    const focused = focusedOnRef;
    return () => {
      const prev = focused.current;
      focused.current = null;
      if (isLive(prev)) clearFocus(prev, "keyboard");
    };
  }, []);

  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const instance = chartInstanceRef.current;
      const markCount =
        mode === "marks" ? (isLive(instance) ? listFocusTargets(instance).length : 0) : categoryCount;
      if (!enabled || markCount <= 0 || effectiveSeriesKeys.length === 0) return;

      if (e.key === "Escape") {
        setFocus(null);
        return;
      }

      if (e.key === "Enter" || e.key === " ") {
        if (activeFocus == null) return;
        e.preventDefault();
        if (mode === "marks") {
          if (!isLive(instance)) return;
          const target = targetFor(instance, activeFocus);
          const params = target ? markParamsAt(instance, target) : null;
          if (!params) return;
          // Re-dispatch as an ECharts click so Enter maps through the canvas's own
          // click handler (`useChartInteraction`) — identical event to a pointer click.
          (instance as unknown as { trigger(type: string, params: unknown): void }).trigger(
            "click",
            {
              ...params,
              event: {
                event: {
                  shiftKey: e.shiftKey,
                  metaKey: e.metaKey,
                  altKey: e.altKey,
                  ctrlKey: e.ctrlKey,
                },
              },
            },
          );
          return;
        }
        const absoluteIndex = activeFocus.category + indexOffset;
        const datum = absoluteRows[absoluteIndex] ?? data[activeFocus.category] ?? {};
        const seriesKey =
          mode === "pie" && nameKey
            ? String(datum[nameKey] ?? "")
            : effectiveSeriesKeys[activeFocus.series]!;
        if (!seriesKey) return;

        const raw =
          mode === "pie"
            ? datum[valueKey] ?? datum[seriesKey]
            : datum[seriesKey];
        if (raw == null || raw === "") return;

        const value = typeof raw === "number" ? raw : Number(raw);
        if (!Number.isFinite(value)) return;

        onMarkClick?.({
          category: (xDataKey ?? nameKey)
            ? datum[xDataKey ?? nameKey!]
            : activeFocus.category,
          seriesKey,
          datum,
          value,
          index: absoluteIndex,
          modifiers: {
            shift: e.shiftKey,
            meta: e.metaKey,
            alt: e.altKey,
            ctrl: e.ctrlKey,
          },
        });
        return;
      }

      const maxCat = markCount - 1;
      const maxSeries = effectiveSeriesKeys.length - 1;

      if (
        e.key === "ArrowRight" ||
        e.key === "ArrowLeft" ||
        e.key === "ArrowUp" ||
        e.key === "ArrowDown"
      ) {
        e.preventDefault();
        setFocus((prev) => {
          const base = prev ?? { category: 0, series: 0 };
          if (mode === "pie" || mode === "marks") {
            if (e.key === "ArrowRight" || e.key === "ArrowDown") {
              return { category: Math.min(maxCat, base.category + 1), series: 0 };
            }
            return { category: Math.max(0, base.category - 1), series: 0 };
          }
          if (e.key === "ArrowRight") {
            return { ...base, category: Math.min(maxCat, base.category + 1) };
          }
          if (e.key === "ArrowLeft") {
            return { ...base, category: Math.max(0, base.category - 1) };
          }
          if (e.key === "ArrowDown") {
            return { ...base, series: Math.min(maxSeries, base.series + 1) };
          }
          return { ...base, series: Math.max(0, base.series - 1) };
        });
      }
    },
    [
      chartInstanceRef,
      targetFor,
      enabled,
      categoryCount,
      effectiveSeriesKeys,
      data,
      absoluteRows,
      xDataKey,
      onMarkClick,
      activeFocus,
      indexOffset,
      mode,
      nameKey,
      valueKey,
    ],
  );

  return {
    tabIndex: enabled ? 0 : undefined,
    onKeyDown: enabled ? onKeyDown : undefined,
    "aria-label": enabled
      ? "Chart. Use arrow keys to move between marks, Enter to select."
      : undefined,
    role: enabled ? ("application" as const) : undefined,
  };
}
