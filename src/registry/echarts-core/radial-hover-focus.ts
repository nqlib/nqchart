/**
 * @deprecated Thin compatibility shim — the radial repair lives in
 * `hover-focus-repair.ts` (radial adapter). Kept so the names recorded in
 * `.agents/skills/fixed/` still resolve; new code calls `focusMark` / `clearFocus`.
 */

import type { EChartsType } from "echarts/core";
import {
  HOVER_REPAIR_ADAPTERS,
  repairHoverFocus,
  resetHoverFocus,
  scheduleHoverFocusRepair,
  isRadialRingSeries,
  RADIAL_TRACK_SERIES_ID,
  resolveRepairAdapter,
} from "./hover-focus-repair";

export { isRadialRingSeries, RADIAL_TRACK_SERIES_ID };

const adapter = HOVER_REPAIR_ADAPTERS.find((a) => a.family === "radial")!;

export function repairRadialHoverFocus(instance: EChartsType, hoveredSeriesIndex: number): void {
  repairHoverFocus(instance, adapter, { seriesIndex: hoveredSeriesIndex });
}

export function scheduleRadialHoverFocusRepair(instance: EChartsType, seriesIndex: number): void {
  scheduleHoverFocusRepair(instance, adapter, { seriesIndex });
}

export function resetRadialHoverFocus(instance: EChartsType): void {
  resetHoverFocus(instance, adapter);
}

export function isRadialRingSeriesEvent(
  instance: EChartsType,
  params: { seriesType?: string; seriesIndex?: number },
): boolean {
  if (params.seriesType !== "bar" || params.seriesIndex == null) return false;
  return resolveRepairAdapter(instance, params.seriesIndex)?.family === "radial";
}
