/**
 * @deprecated Thin compatibility shim — the waterfall repair lives in
 * `hover-focus-repair.ts` (waterfall adapter). Kept so the names recorded in
 * `.agents/skills/fixed/` still resolve; new code calls `focusMark` / `clearFocus`.
 */

import type { EChartsType } from "echarts/core";
import {
  HOVER_REPAIR_ADAPTERS,
  repairHoverFocus,
  resetHoverFocus,
  scheduleHoverFocusRepair,
  WATERFALL_VALUES_SERIES,
} from "./hover-focus-repair";

export { WATERFALL_VALUES_SERIES };

const adapter = HOVER_REPAIR_ADAPTERS.find((a) => a.family === "waterfall")!;

export function repairWaterfallHoverFocus(
  instance: EChartsType,
  seriesIndex: number,
  dataIndex: number,
): void {
  repairHoverFocus(instance, adapter, { seriesIndex, dataIndex });
}

export function scheduleWaterfallHoverFocusRepair(
  instance: EChartsType,
  seriesIndex: number,
  dataIndex: number,
): void {
  scheduleHoverFocusRepair(instance, adapter, { seriesIndex, dataIndex });
}

export function resetWaterfallHoverFocus(instance: EChartsType): void {
  resetHoverFocus(instance, adapter);
}

export function isWaterfallValuesSeriesEvent(params: {
  seriesType?: string;
  seriesName?: string;
}): boolean {
  return params.seriesType === "bar" && params.seriesName === WATERFALL_VALUES_SERIES;
}
