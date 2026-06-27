/** Theme-aware chart palette slots from globals.css (--chart-1 … --chart-5). */

export const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
] as const;

export type ChartColorSlot = (typeof CHART_COLORS)[number];

/** Resolve a palette slot by index (wraps). */
export function chartColorByIndex(index: number): ChartColorSlot {
  const len = CHART_COLORS.length;
  return CHART_COLORS[((index % len) + len) % len]!;
}

/** Single-slot colors for ChartConfig (CSS vars adapt to light/dark automatically). */
export function chartConfigColor(index: number): { light: [string]; dark: [string] } {
  const color = chartColorByIndex(index);
  return { light: [color], dark: [color] };
}

/** Multi-stop gradient slots for ChartConfig. */
export function chartConfigGradient(
  startIndex: number,
  endIndex: number,
): { light: [string, string]; dark: [string, string] } {
  return {
    light: [chartColorByIndex(startIndex), chartColorByIndex(endIndex)],
    dark: [chartColorByIndex(startIndex), chartColorByIndex(endIndex)],
  };
}
