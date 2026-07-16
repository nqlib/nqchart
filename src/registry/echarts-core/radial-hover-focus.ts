import type { EChartsType } from "echarts/core";
import { enterBlur, enterEmphasis, leaveBlur, leaveEmphasis } from "echarts/lib/util/states.js";

/** Matches `compile-radial-bar.ts` silent track series id. */
export const RADIAL_TRACK_SERIES_ID = "__radial_track__";

type RadialBarData = {
  count(): number;
  getItemGraphicEl(index: number): unknown;
};

type RadialBarSeriesModel = {
  subType?: string;
  get?(key: string): unknown;
  getData(): RadialBarData;
};

type BarSeriesView = {
  _backgroundEls?: Array<unknown | null | undefined>;
};

const NEEDS_STATUS_UPDATE = "__needsUpdateStatus";

type PendingRepair = {
  seriesIndex: number;
};

const pendingRepairs = new WeakMap<EChartsType, PendingRepair>();

function markChartStatesDirty(instance: EChartsType): void {
  (instance as unknown as Record<string, boolean>)[NEEDS_STATUS_UPDATE] = true;
  instance.getZr().wakeUp();
}

function getChartModel(instance: EChartsType) {
  return (
    instance as unknown as {
      getModel(): {
        getSeriesByIndex(index: number): RadialBarSeriesModel | null;
        eachSeries(fn: (series: RadialBarSeriesModel, rawIndex: number) => void): void;
      };
    }
  ).getModel();
}

function getSeriesView(instance: EChartsType, series: RadialBarSeriesModel): BarSeriesView | null {
  const view = (
    instance as unknown as {
      getViewOfSeriesModel?(model: RadialBarSeriesModel): BarSeriesView | null;
    }
  ).getViewOfSeriesModel?.(series);
  return view ?? null;
}

function seriesOpt(series: RadialBarSeriesModel, key: string): unknown {
  return typeof series.get === "function" ? series.get(key) : undefined;
}

function isRadialTrackSeries(series: RadialBarSeriesModel | null | undefined): boolean {
  return series?.subType === "bar" && seriesOpt(series, "id") === RADIAL_TRACK_SERIES_ID;
}

/** Concentric rings and rose petals — polar bar, not the silent track. */
export function isRadialRingSeries(series: RadialBarSeriesModel | null | undefined): boolean {
  if (!series || series.subType !== "bar") return false;
  if (isRadialTrackSeries(series)) return false;
  if (seriesOpt(series, "silent") === true) return false;

  const stack = seriesOpt(series, "stack");
  if (stack === "ring" || stack === "petal") return true;

  return seriesOpt(series, "coordinateSystem") === "polar";
}

function focusedCategoryIndex(series: RadialBarSeriesModel): number | null {
  const data = series.getData();
  for (let i = 0; i < data.count(); i++) {
    if (data.getItemGraphicEl(i)) return i;
  }
  return null;
}

/** Track marks are native `showBackground` sectors on the silent track series. */
function forEachTrackBackground(
  instance: EChartsType,
  apply: (el: unknown, dataIndex: number) => void,
): void {
  getChartModel(instance).eachSeries((series) => {
    if (!isRadialTrackSeries(series)) return;
    const backgrounds = getSeriesView(instance, series)?._backgroundEls;
    if (!backgrounds) return;
    for (let dataIndex = 0; dataIndex < backgrounds.length; dataIndex++) {
      const el = backgrounds[dataIndex];
      if (el) apply(el, dataIndex);
    }
  });
}

function forEachRingOrTrackGraphic(
  instance: EChartsType,
  apply: (series: RadialBarSeriesModel, seriesIndex: number, dataIndex: number, el: unknown) => void,
): void {
  getChartModel(instance).eachSeries((series, seriesIndex) => {
    if (!isRadialRingSeries(series) && !isRadialTrackSeries(series)) return;
    const data = series.getData();
    for (let dataIndex = 0; dataIndex < data.count(); dataIndex++) {
      const el = data.getItemGraphicEl(dataIndex);
      if (!el) continue;
      apply(series, seriesIndex, dataIndex, el);
    }
  });
  forEachTrackBackground(instance, (el, dataIndex) => {
    apply({ subType: "bar" } as RadialBarSeriesModel, -1, dataIndex, el);
  });
}

/**
 * Polar radial / rose — one series per ring or petal. Re-emphasize the hovered ring and blur
 * siblings. Full concentric charts also blur non-hovered **track** segments — otherwise the
 * always-on 0.35-opacity tracks hide the focus effect on the basic full-circle variant.
 */
export function repairRadialHoverFocus(instance: EChartsType, hoveredSeriesIndex: number): void {
  const hovered = getChartModel(instance).getSeriesByIndex(hoveredSeriesIndex);
  // isRadialRingSeries returns false for null, so a truthy result guarantees
  // non-null; the boolean return can't narrow the type, hence the assertion.
  if (!isRadialRingSeries(hovered)) return;

  const focusIndex = focusedCategoryIndex(hovered!);
  if (focusIndex == null) return;

  forEachRingOrTrackGraphic(instance, (_series, _seriesIndex, _dataIndex, el) => {
    leaveEmphasis(el);
    leaveBlur(el);
  });

  getChartModel(instance).eachSeries((series, seriesIndex) => {
    if (!isRadialRingSeries(series)) return;
    const data = series.getData();
    for (let dataIndex = 0; dataIndex < data.count(); dataIndex++) {
      const el = data.getItemGraphicEl(dataIndex);
      if (!el) continue;

      if (seriesIndex === hoveredSeriesIndex) {
        leaveBlur(el);
        enterEmphasis(el);
      } else {
        leaveEmphasis(el);
        enterBlur(el);
      }
    }
  });

  forEachTrackBackground(instance, (el, dataIndex) => {
    if (dataIndex === focusIndex) {
      leaveBlur(el);
      return;
    }
    enterBlur(el);
  });

  markChartStatesDirty(instance);
}

/** Coalesce hovers; double rAF runs after ECharts high-down (scatter timing). */
export function scheduleRadialHoverFocusRepair(
  instance: EChartsType,
  seriesIndex: number,
): void {
  let pending = pendingRepairs.get(instance);
  if (pending) {
    pending.seriesIndex = seriesIndex;
    return;
  }

  pending = { seriesIndex };
  pendingRepairs.set(instance, pending);

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      const current = pendingRepairs.get(instance);
      if (!current) return;
      repairRadialHoverFocus(instance, current.seriesIndex);
      pendingRepairs.delete(instance);
    });
  });
}

export function resetRadialHoverFocus(instance: EChartsType): void {
  pendingRepairs.delete(instance);

  forEachRingOrTrackGraphic(instance, (_series, _seriesIndex, _dataIndex, el) => {
    leaveEmphasis(el);
    leaveBlur(el);
  });

  markChartStatesDirty(instance);
}

export function isRadialRingSeriesEvent(
  instance: EChartsType,
  params: { seriesType?: string; seriesIndex?: number },
): boolean {
  if (params.seriesType !== "bar" || params.seriesIndex == null) return false;
  return isRadialRingSeries(getChartModel(instance).getSeriesByIndex(params.seriesIndex));
}
