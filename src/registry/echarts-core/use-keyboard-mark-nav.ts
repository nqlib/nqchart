"use client";

/**
 * Keyboard navigation for chart marks — arrows move focus; Enter fires onMarkClick.
 */

import { useCallback, useEffect, useState, type KeyboardEvent, type RefObject } from "react";
import type { EChartsType } from "echarts/core";
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
   */
  mode?: "cartesian" | "pie";
  nameKey?: string;
  valueKey?: string;
};

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
}: KeyboardMarkNavOpts) {
  const [focus, setFocus] = useState<{ category: number; series: number } | null>(null);
  const activeFocus = enabled ? focus : null;
  const effectiveSeriesKeys = mode === "pie" ? ["__pie__"] : seriesKeys;
  const absoluteRows = fullData ?? data;

  useEffect(() => {
    const instance = chartInstanceRef.current;
    if (!instance || activeFocus == null) return;
    const seriesIndex = mode === "pie" ? 0 : activeFocus.series;
    instance.dispatchAction({
      type: "highlight",
      seriesIndex,
      dataIndex: activeFocus.category,
    });
    instance.dispatchAction({
      type: "showTip",
      seriesIndex,
      dataIndex: activeFocus.category,
    });
    return () => {
      instance.dispatchAction({ type: "downplay" });
      instance.dispatchAction({ type: "hideTip" });
    };
  }, [activeFocus, chartInstanceRef, mode]);

  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!enabled || categoryCount <= 0 || effectiveSeriesKeys.length === 0) return;

      if (e.key === "Escape") {
        setFocus(null);
        return;
      }

      if (e.key === "Enter" || e.key === " ") {
        if (activeFocus == null) return;
        e.preventDefault();
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

      const maxCat = categoryCount - 1;
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
          if (mode === "pie") {
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
