"use client";

import { useCallback, useEffect, useMemo, useRef, type Ref } from "react";
import type { EChartsOption } from "echarts";
import type { EChartsType } from "echarts/core";
import { configKeyFromDisplayName } from "./config-key-from-display-name";
import { createChartHandle, type ChartHandle } from "./chart-handle";
import {
  mapEChartsClickToMarkEvent,
  type NQMarkEvent,
} from "./nq-mark-event";
import type { NQChartEventHandlers } from "./use-nq-echarts";
import { useChart } from "@/registry/ui/chart";

export type ChartInteractionProps = {
  onMarkClick?: (event: NQMarkEvent) => void;
  onChartReady?: (instance: EChartsType) => void;
  chartRef?: Ref<ChartHandle | null>;
  data: Record<string, unknown>[];
  xDataKey?: string;
  nameKey?: string;
  valueKey?: string;
  /** Brush window start — added to ECharts dataIndex for absolute row index. */
  indexOffset?: number;
};

function assignRef<T>(ref: Ref<T | null> | undefined, value: T | null) {
  if (!ref) return;
  if (typeof ref === "function") ref(value);
  else ref.current = value;
}

/**
 * Set the series cursor to match whether marks are actually clickable.
 *
 * Both branches have to be written. ECharts' own default for a series cursor is
 * already `"pointer"`, so returning the option untouched when nothing is bound
 * leaves every mark advertising an interaction that does not exist — the chart
 * promises a click and then swallows it. Only a chart with a mark handler earns
 * the pointer; everything else is explicitly `"default"`.
 *
 * Reference marks are skipped either way: they are decoration and never take a
 * cursor of their own.
 */
export function withMarkPointerCursor(option: EChartsOption, enabled: boolean): EChartsOption {
  const series = option.series
    ? Array.isArray(option.series)
      ? option.series
      : [option.series]
    : [];
  if (series.length === 0) return option;
  const cursor = enabled ? "pointer" : "default";
  return {
    ...option,
    series: series.map((s) => {
      if (!s || typeof s !== "object") return s;
      const id = (s as { id?: string }).id;
      if (typeof id === "string" && id.startsWith("__nq_reference")) return s;
      return { ...s, cursor };
    }) as EChartsOption["series"],
  };
}

/**
 * Shared mark-click / chart-ready / chartRef wiring for any EChartsHost canvas.
 */
export function useChartInteraction({
  onMarkClick,
  onChartReady,
  chartRef,
  data,
  xDataKey,
  nameKey,
  valueKey,
  indexOffset = 0,
  extraHandlers,
}: ChartInteractionProps & {
  extraHandlers?: NQChartEventHandlers;
}) {
  const { chartId, config } = useChart();
  const instanceRef = useRef<EChartsType | null>(null);
  const onMarkClickRef = useRef(onMarkClick);
  const onChartReadyRef = useRef(onChartReady);
  const dataRef = useRef(data);
  const xKeyRef = useRef(xDataKey);
  const nameKeyRef = useRef(nameKey);
  const valueKeyRef = useRef(valueKey);
  const indexOffsetRef = useRef(indexOffset);
  const configRef = useRef(config);

  useEffect(() => {
    onMarkClickRef.current = onMarkClick;
    onChartReadyRef.current = onChartReady;
    dataRef.current = data;
    xKeyRef.current = xDataKey;
    nameKeyRef.current = nameKey;
    valueKeyRef.current = valueKey;
    indexOffsetRef.current = indexOffset;
    configRef.current = config;
  });

  const handleChartInstance = useCallback(
    (instance: EChartsType | null) => {
      instanceRef.current = instance;
      if (instance) {
        onChartReadyRef.current?.(instance);
        assignRef(chartRef, createChartHandle(() => instanceRef.current, chartId));
      } else {
        assignRef(chartRef, null);
      }
    },
    [chartId, chartRef],
  );

  const eventHandlers = useMemo<NQChartEventHandlers | undefined>(() => {
    const hasClick = Boolean(onMarkClick);
    if (!hasClick && !extraHandlers) return undefined;

    return {
      ...extraHandlers,
      onSeriesClick: hasClick
        ? (params) => {
            const event = mapEChartsClickToMarkEvent(params, {
              data: dataRef.current,
              xDataKey: xKeyRef.current,
              nameKey: nameKeyRef.current,
              valueKey: valueKeyRef.current,
              indexOffset: indexOffsetRef.current,
              seriesKeyFromName: (seriesName) =>
                seriesName
                  ? configKeyFromDisplayName(seriesName, configRef.current)
                  : undefined,
            });
            if (event) onMarkClickRef.current?.(event);
          }
        : extraHandlers?.onSeriesClick,
    };
  }, [onMarkClick, extraHandlers]);

  return {
    eventHandlers,
    onChartInstance: handleChartInstance,
    instanceRef,
    pointerEnabled: Boolean(onMarkClick),
  };
}
