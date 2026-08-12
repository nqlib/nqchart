import type { EChartsType } from "echarts/core";
import { enterBlur, leaveBlur, leaveEmphasis } from "echarts/lib/util/states.js";

type PieData = {
  count(): number;
  getItemGraphicEl(index: number): unknown;
};

type PieSeriesModel = {
  subType?: string;
  getData(): PieData;
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

function getPieData(instance: EChartsType, seriesIndex: number): PieData | null {
  return (
    instance as unknown as {
      getModel(): { getSeriesByIndex(index: number): PieSeriesModel | null };
    }
  )
    .getModel()
    .getSeriesByIndex(seriesIndex)
    ?.getData() ?? null;
}

/**
 * Pie slices skip mouseout between adjacent wedges; blurSeries skips paths with
 * __highByOuter. Reset all slices, then blur non-hovered only — hovered stays normal
 * so native emphasis (disabled at compile) does not fight NQChart blur sync.
 */
export function repairPieHoverFocus(
  instance: EChartsType,
  seriesIndex: number,
  dataIndex: number,
): void {
  const data = getPieData(instance, seriesIndex);
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
export function schedulePieHoverFocusRepair(
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
    repairPieHoverFocus(instance, current.seriesIndex, current.dataIndex);
    pendingRepairs.delete(instance);
  });
}

export function resetPieHoverFocus(instance: EChartsType): void {
  pendingRepairs.delete(instance);
  const model = (
    instance as unknown as { getModel(): { eachSeries(fn: (s: PieSeriesModel) => void): void } }
  ).getModel();

  model.eachSeries((series) => {
    if (series.subType !== "pie") return;
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
