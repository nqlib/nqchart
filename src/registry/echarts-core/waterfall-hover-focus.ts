import type { EChartsType } from "echarts/core";
import { enterBlur, leaveBlur, leaveEmphasis } from "echarts/lib/util/states.js";

/** Matches `compile-waterfall.ts` values series name. */
export const WATERFALL_VALUES_SERIES = "__wf_values__";

type WaterfallBarData = {
  count(): number;
  getItemGraphicEl(index: number): unknown;
};

type WaterfallBarSeriesModel = {
  subType?: string;
  name?: string;
  getData(): WaterfallBarData;
};

const NEEDS_STATUS_UPDATE = "__needsUpdateStatus";

type PendingRepair = {
  seriesIndex: number;
  dataIndex: number;
};

const pendingRepairs = new WeakMap<EChartsType, PendingRepair>();

function markChartStatesDirty(instance: EChartsType): void {
  (instance as unknown as Record<string, boolean>)[NEEDS_STATUS_UPDATE] = true;
  instance.getZr().wakeUp();
}

function getWaterfallValuesData(
  instance: EChartsType,
  seriesIndex: number,
): WaterfallBarData | null {
  const series = (
    instance as unknown as {
      getModel(): { getSeriesByIndex(index: number): WaterfallBarSeriesModel | null };
    }
  )
    .getModel()
    .getSeriesByIndex(seriesIndex);

  if (series?.subType !== "bar" || series.name !== WATERFALL_VALUES_SERIES) {
    return null;
  }

  return series.getData();
}

/**
 * Waterfall stacks a silent placeholder + values series. Native index focus races on
 * stacked bars and can blur the hovered column; sync all value bars by category index.
 */
export function repairWaterfallHoverFocus(
  instance: EChartsType,
  seriesIndex: number,
  dataIndex: number,
): void {
  const data = getWaterfallValuesData(instance, seriesIndex);
  if (!data) return;

  for (let i = 0; i < data.count(); i++) {
    const el = data.getItemGraphicEl(i);
    if (!el) continue;
    leaveEmphasis(el);
    leaveBlur(el);
  }

  for (let i = 0; i < data.count(); i++) {
    if (i === dataIndex) continue;
    const el = data.getItemGraphicEl(i);
    if (!el) continue;
    enterBlur(el);
  }

  markChartStatesDirty(instance);
}

/** Coalesce same-tick hovers; repair runs once per microtask after ECharts mouseover params. */
export function scheduleWaterfallHoverFocusRepair(
  instance: EChartsType,
  seriesIndex: number,
  dataIndex: number,
): void {
  let pending = pendingRepairs.get(instance);
  if (pending) {
    pending.seriesIndex = seriesIndex;
    pending.dataIndex = dataIndex;
    return;
  }

  pending = { seriesIndex, dataIndex };
  pendingRepairs.set(instance, pending);

  queueMicrotask(() => {
    const current = pendingRepairs.get(instance);
    if (!current) return;
    repairWaterfallHoverFocus(instance, current.seriesIndex, current.dataIndex);
    pendingRepairs.delete(instance);
  });
}

export function resetWaterfallHoverFocus(instance: EChartsType): void {
  pendingRepairs.delete(instance);
  const model = (
    instance as unknown as {
      getModel(): { eachSeries(fn: (s: WaterfallBarSeriesModel) => void): void };
    }
  ).getModel();

  model.eachSeries((series) => {
    if (series.subType !== "bar" || series.name !== WATERFALL_VALUES_SERIES) return;
    const data = series.getData();
    for (let i = 0; i < data.count(); i++) {
      const el = data.getItemGraphicEl(i);
      if (!el) continue;
      leaveEmphasis(el);
      leaveBlur(el);
    }
  });

  markChartStatesDirty(instance);
}

export function isWaterfallValuesSeriesEvent(params: {
  seriesType?: string;
  seriesName?: string;
}): boolean {
  return params.seriesType === "bar" && params.seriesName === WATERFALL_VALUES_SERIES;
}
