import type { EChartsType } from "echarts/core";
import { enterBlur, enterEmphasis, leaveBlur, leaveEmphasis } from "echarts/lib/util/states.js";

type ZrEl = unknown;

type SymbolGraphic = {
  childAt?: (index: number) => SymbolGraphic | null;
};

type ScatterData = {
  count(): number;
  getItemGraphicEl(index: number): SymbolGraphic | null;
};

const NEEDS_STATUS_UPDATE = "__needsUpdateStatus";

function markChartStatesDirty(instance: EChartsType): void {
  (instance as unknown as Record<string, boolean>)[NEEDS_STATUS_UPDATE] = true;
  instance.getZr().wakeUp();
}

function symbolPath(group: SymbolGraphic | null): ZrEl | null {
  return group?.childAt?.(0) ?? null;
}

function getScatterData(instance: EChartsType, seriesIndex: number): ScatterData | null {
  type SeriesModel = { getData(): ScatterData };
  return (
    instance as unknown as {
      getModel(): { getSeriesByIndex(index: number): SeriesModel | null };
    }
  )
    .getModel()
    .getSeriesByIndex(seriesIndex)
    ?.getData() ?? null;
}

/**
 * ECharts Symbol hover blurs `childAt(0)` on the focused point; we re-emphasize it.
 * `enterEmphasis(path)` sets `__highByOuter`, so later hovers skip blurring stale paths —
 * sync every symbol in the series on each hover.
 */
export function repairScatterHoverFocus(
  instance: EChartsType,
  seriesIndex: number,
  dataIndex: number,
): void {
  const data = getScatterData(instance, seriesIndex);
  if (!data) return;

  for (let i = 0; i < data.count(); i++) {
    const path = symbolPath(data.getItemGraphicEl(i));
    if (!path) continue;

    if (i === dataIndex) {
      leaveBlur(path);
      enterEmphasis(path);
    } else {
      leaveEmphasis(path);
      enterBlur(path);
    }
  }

  markChartStatesDirty(instance);
}

/** Clear repair emphasis/blur when the pointer leaves the chart. */
export function resetScatterHoverFocus(instance: EChartsType): void {
  type SeriesModel = { subType?: string; getData(): ScatterData };
  const model = (instance as unknown as { getModel(): { eachSeries(fn: (s: SeriesModel) => void): void } }).getModel();

  model.eachSeries((series) => {
    if (series.subType !== "scatter") return;
    const data = series.getData();
    for (let i = 0; i < data.count(); i++) {
      const path = symbolPath(data.getItemGraphicEl(i));
      if (!path) continue;
      leaveEmphasis(path);
      leaveBlur(path);
    }
  });

  markChartStatesDirty(instance);
}
