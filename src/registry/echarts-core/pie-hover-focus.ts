/**
 * @deprecated Thin compatibility shim — the pie repair lives in
 * `hover-focus-repair.ts` (pie adapter). Kept so the names recorded in
 * `.agents/skills/fixed/` still resolve; new code calls `focusMark` / `clearFocus`.
 */

import type { EChartsType } from "echarts/core";
import {
  HOVER_REPAIR_ADAPTERS,
  repairHoverFocus,
  resetHoverFocus,
  scheduleHoverFocusRepair,
} from "./hover-focus-repair";

const adapter = HOVER_REPAIR_ADAPTERS.find((a) => a.family === "pie")!;

export function repairPieHoverFocus(
  instance: EChartsType,
  seriesIndex: number,
  dataIndex: number,
): void {
  repairHoverFocus(instance, adapter, { seriesIndex, dataIndex });
}

export function schedulePieHoverFocusRepair(
  instance: EChartsType,
  seriesIndex: number,
  dataIndex: number,
): void {
  scheduleHoverFocusRepair(instance, adapter, { seriesIndex, dataIndex });
}

export function resetPieHoverFocus(instance: EChartsType): void {
  resetHoverFocus(instance, adapter);
}
