/**
 * @deprecated Thin compatibility shim — the scatter repair lives in
 * `hover-focus-repair.ts` (scatter adapter). Kept so the names recorded in
 * `.agents/skills/fixed/` still resolve; new code calls `focusMark` / `clearFocus`.
 */

import type { EChartsType } from "echarts/core";
import {
  HOVER_REPAIR_ADAPTERS,
  repairHoverFocus,
  resetHoverFocus,
  scheduleHoverFocusRepair,
} from "./hover-focus-repair";

const adapter = HOVER_REPAIR_ADAPTERS.find((a) => a.family === "scatter")!;

export function repairScatterHoverFocus(
  instance: EChartsType,
  seriesIndex: number,
  dataIndex: number,
): void {
  repairHoverFocus(instance, adapter, { seriesIndex, dataIndex });
}

export function scheduleScatterHoverFocusRepair(
  instance: EChartsType,
  seriesIndex: number,
  dataIndex: number,
): void {
  scheduleHoverFocusRepair(instance, adapter, { seriesIndex, dataIndex });
}

export function resetScatterHoverFocus(instance: EChartsType): void {
  resetHoverFocus(instance, adapter);
}
