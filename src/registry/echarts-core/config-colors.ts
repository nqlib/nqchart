/**
 * Pure helpers over a chart config's colour slots.
 *
 * The compile path imports no React module; a Node consumer runs it with no DOM.
 * `getColorsCount` lived in `ui/chart.tsx`, a `"use client"` file that imports
 * React, so every compiler that reached it pulled React into a headless caller.
 * `ui/chart.tsx` re-exports it from here so its public surface does not move.
 */
import type { ChartConfig } from "@/registry/ui/chart";

/** The theme slots a config entry's `colors` may hold. Mirrors `THEMES` in `ui/chart.tsx`. */
const COLOR_THEME_KEYS = ["light", "dark"] as const;

/** The number of colours in a config entry: the longest theme slot, at least 1. */
export function getColorsCount(config: ChartConfig[string]): number {
  if (!config.colors) return 1;
  const counts = COLOR_THEME_KEYS.map((theme) => config.colors?.[theme]?.length ?? 0);
  return Math.max(...counts, 1);
}
