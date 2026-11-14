/**
 * Pure waterfall math and direction colors — no ECharts, no DOM.
 *
 * A step moves the running total from `start` to `end`. `start` / `total` rows
 * reset the running total and draw from zero.
 */
import type { ChartConfig } from "@/registry/ui/chart";

export type WaterfallKind = "start" | "increase" | "decrease" | "total";
/** The three color roles of a direction-colored waterfall (config keys). */
export type WaterfallDirection = "increase" | "decrease" | "total";
export const WATERFALL_DIRECTIONS: readonly WaterfallDirection[] = [
  "increase",
  "decrease",
  "total",
];

export type WaterfallStep = {
  kind: WaterfallKind;
  direction: WaterfallDirection;
  /** Signed change for a step; the value itself for `start` / `total`. */
  delta: number;
  /** Where the column starts (the running total before the step, or 0). */
  start: number;
  /** Where the column ends (the running total after the step). */
  end: number;
};

/**
 * One step per row. The sign of the value decides the direction of a step;
 * `type: "start" | "total"` marks a column that draws from zero.
 */
export function buildWaterfallSteps(
  rows: Record<string, unknown>[],
  valueKey: string,
  typeKey: string,
): WaterfallStep[] {
  let running = 0;
  return rows.map((row) => {
    const raw = Number(row[valueKey] ?? 0);
    const value = Number.isFinite(raw) ? raw : 0;
    const type = row[typeKey] ?? row.type;
    if (type === "start" || type === "total") {
      running = value;
      return { kind: type, direction: "total", delta: value, start: 0, end: value };
    }
    const start = running;
    running += value;
    const direction: WaterfallDirection = value < 0 ? "decrease" : "increase";
    return { kind: direction, direction, delta: value, start, end: running };
  });
}

/**
 * Default direction colors. Each passes 3:1 on the card surface: emerald-600 /
 * red-600 / neutral-500 on light, the 400 shades on dark (KPI card tones).
 */
const GOOD = { light: ["#059669"], dark: ["#34d399"] };
const BAD = { light: ["#dc2626"], dark: ["#f87171"] };
const NEUTRAL = { light: ["#737373"], dark: ["#a3a3a3"] };

const DEFAULT_LABEL: Record<WaterfallDirection, string> = {
  increase: "Increase",
  decrease: "Decrease",
  total: "Total",
};

/**
 * Add the `increase` / `decrease` / `total` entries that `config` does not
 * have. `higherIsBetter: false` swaps the default good and bad colors; a
 * color the caller sets is kept as given.
 */
export function withWaterfallDirectionConfig(
  config: ChartConfig,
  higherIsBetter = true,
): ChartConfig {
  const defaults: Record<WaterfallDirection, ChartConfig[string]> = {
    increase: { label: DEFAULT_LABEL.increase, colors: higherIsBetter ? GOOD : BAD },
    decrease: { label: DEFAULT_LABEL.decrease, colors: higherIsBetter ? BAD : GOOD },
    total: { label: DEFAULT_LABEL.total, colors: NEUTRAL },
  };
  const out: ChartConfig = { ...config };
  for (const key of WATERFALL_DIRECTIONS) {
    const entry = config[key];
    if (!entry) out[key] = defaults[key];
    else if (!entry.colors) out[key] = { ...entry, colors: defaults[key].colors };
  }
  return out;
}

/** The directions that the steps use, in legend order. */
export function directionsInUse(steps: WaterfallStep[]): WaterfallDirection[] {
  const used = new Set(steps.map((s) => s.direction));
  return WATERFALL_DIRECTIONS.filter((d) => used.has(d));
}
