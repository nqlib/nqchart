import type { EChartsType } from "echarts/core";
import { enterBlur, leaveBlur, leaveEmphasis } from "echarts/lib/util/states.js";

type TreemapData = {
  count(): number;
  getItemGraphicEl(index: number): unknown;
};

type TreemapSeriesModel = {
  subType?: string;
  getData(): TreemapData;
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

function getTreemapData(instance: EChartsType, seriesIndex: number): TreemapData | null {
  return (
    instance as unknown as {
      getModel(): { getSeriesByIndex(index: number): TreemapSeriesModel | null };
    }
  )
    .getModel()
    .getSeriesByIndex(seriesIndex)
    ?.getData() ?? null;
}

/**
 * Treemap leaves use a Group dispatcher with inner content rects. Adjacent tiles
 * often skip mouseout, leaving stale mouse emphasis; blurSeries skips paths with
 * __highByOuter. Reset all tiles, then blur non-hovered only — the hovered tile
 * stays in normal state so ECharts treemap emphasis styles (gap fill on bg) do not
 * hide the tile color.
 */
export function repairTreemapHoverFocus(
  instance: EChartsType,
  seriesIndex: number,
  dataIndex: number,
): void {
  const data = getTreemapData(instance, seriesIndex);
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
export function scheduleTreemapHoverFocusRepair(
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
    repairTreemapHoverFocus(instance, current.seriesIndex, current.dataIndex);
    pendingRepairs.delete(instance);
  });
}

export function resetTreemapHoverFocus(instance: EChartsType): void {
  pendingRepairs.delete(instance);
  const model = (
    instance as unknown as { getModel(): { eachSeries(fn: (s: TreemapSeriesModel) => void): void } }
  ).getModel();

  model.eachSeries((series) => {
    if (series.subType !== "treemap") return;
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
