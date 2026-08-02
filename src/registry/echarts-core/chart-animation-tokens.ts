import type { EChartsOption } from "echarts";

/**
 * ECharts does not export its `AnimationEasing` union, so derive it from the
 * public option surface.
 */
type AnimationEasing = NonNullable<EChartsOption["animationEasing"]>;

/**
 * Single source of truth for NQChart ECharts animation timing and easing.
 *
 * Retune every chart intro by changing {@link CHART_INTRO_DURATION_MS}.
 * Per-chart blocks below only override stagger / easing when the motion type
 * needs it (line draw, fold, etc.) — not a separate duration ladder.
 *
 * Applied in `apply-chart-animation.ts` via `applyChartUiToOption()` on every
 * ECharts compile path. Monospace fold rAF reads the same intro duration.
 */

/**
 * Easing — aligned to the nqui motion vocabulary so chart marks and UI chrome
 * share an acceleration signature.
 *
 * nqui's `--ease-out` is `cubic-bezier(0.16, 1, 0.3, 1)` — a hard brake that
 * covers most of the distance early, then glides. ECharts' stock `cubicOut`
 * (`cubic-bezier(0.33, 0, 0.67, 1)`) is a gentler, more symmetric decel, which
 * read as "drift" next to nqui's "snap then settle".
 *
 * zrender resolves an unknown easing name through `createCubicEasingFunc`,
 * which regex-matches `cubic-bezier(a,b,c,d)` — so passing nqui's curve as a
 * CSS-syntax **string** gives us the exact same curve the DOM uses. It must be
 * a string in that literal form: a `[x1,y1,x2,y2]` tuple does not match the
 * regex and silently degrades to linear.
 *
 * @see nqui/src/styles/motion.css
 * @see zrender/lib/animation/cubicEasing.js
 */

/** nqui `--ease-out` — entrances/arrivals. */
export const CHART_EASE_OUT = "cubic-bezier(0.16,1,0.3,1)" as AnimationEasing;

/** nqui `--ease-in-out` — neutral baseline for state changes and morphs. */
export const CHART_EASE_IN_OUT = "cubic-bezier(0.4,0,0.2,1)" as AnimationEasing;

export const CHART_EASING = {
  /** Default intro / enter — nqui `--ease-out`. */
  intro: CHART_EASE_OUT,
  /** Default data updates — nqui `--ease-out`, matching entrance feel. */
  update: CHART_EASE_OUT,
  /** Morph / fold / line draw — nqui `--ease-in-out` (symmetric, no snap). */
  morph: CHART_EASE_IN_OUT,
} as const;

/**
 * A `cubic-bezier(...)` string accepted anywhere ECharts takes an easing.
 *
 * Typed as ECharts' `AnimationEasing` because that union only enumerates the
 * built-in easing *names*, while zrender additionally accepts any
 * `cubic-bezier(...)` string at runtime (see the note above). Widening here
 * keeps the single unavoidable cast in one place instead of at every call site.
 */
export type ChartEasing = AnimationEasing;

export type ChartEasingName = ChartEasing;

/**
 * Primary intro duration — monospace bar height, cartesian bars, radial, pie,
 * treemap rollout, etc.
 *
 * 700ms: long enough for a data intro to read as narrative (magnitude and
 * sequence), short enough to stay in the same family as nqui's scale, whose
 * ceiling is `--duration-dramatic` (350ms). Charts legitimately run slower than
 * UI chrome — but the previous 1200ms was 3.4× that ceiling and, with stagger
 * stacked on top, pushed a 12-slice pie past 2s to settle.
 */
export const CHART_INTRO_DURATION_MS = 700;

/** Data-update tween — half intro keeps updates snappy. */
export const CHART_UPDATE_DURATION_MS = CHART_INTRO_DURATION_MS / 2;

/** @deprecated Use {@link CHART_INTRO_DURATION_MS}. Kept for bar/monospace call sites. */
export const CHART_BAR_DURATION_MS = CHART_INTRO_DURATION_MS;

export const CHART_ANIMATION = {
  /** Spread onto series that only need the shared intro tempo. */
  intro: {
    duration: CHART_INTRO_DURATION_MS,
    easing: CHART_EASING.intro,
  },
  root: {
    duration: CHART_INTRO_DURATION_MS,
    durationUpdate: CHART_UPDATE_DURATION_MS,
    easing: CHART_EASING.intro,
    easingUpdate: CHART_EASING.update,
    threshold: 4000,
  },
  bar: {
    duration: CHART_INTRO_DURATION_MS,
    staggerMs: 32,
    waterfallStaggerMs: 46,
  },
  line: {
    duration: CHART_INTRO_DURATION_MS,
    seriesStaggerMs: 70,
    easing: CHART_EASING.morph,
  },
  area: {
    duration: CHART_INTRO_DURATION_MS,
    seriesStaggerMs: 93,
    easing: CHART_EASING.morph,
  },
  composed: {
    duration: CHART_INTRO_DURATION_MS,
    seriesStaggerMs: 70,
    easing: CHART_EASING.morph,
  },
  pie: {
    duration: CHART_INTRO_DURATION_MS,
    staggerMs: 52,
    easing: CHART_EASING.intro,
  },
  /** Polar radial bars — rings / petals sweep in sync. */
  radial: {
    duration: CHART_INTRO_DURATION_MS,
    easing: CHART_EASING.intro,
  },
  gauge: {
    duration: CHART_INTRO_DURATION_MS,
    easing: CHART_EASING.morph,
  },
  radar: {
    duration: CHART_INTRO_DURATION_MS,
    pointStaggerMs: 58,
    easing: CHART_EASING.intro,
  },
  scatter: {
    duration: CHART_INTRO_DURATION_MS,
    staggerMs: 7,
    easing: CHART_EASING.intro,
  },
  heatmap: {
    duration: CHART_INTRO_DURATION_MS,
    staggerMs: 4,
    easing: CHART_EASING.intro,
  },
  funnel: {
    duration: CHART_INTRO_DURATION_MS,
    staggerMs: 58,
    easing: CHART_EASING.intro,
  },
  treemap: {
    duration: CHART_INTRO_DURATION_MS,
    easing: CHART_EASING.intro,
  },
  waterfall: {
    duration: CHART_INTRO_DURATION_MS,
    staggerMs: 46,
    easing: CHART_EASING.intro,
  },
  custom: {
    seriesStaggerMs: 46,
  },
  /** Monospace bar — fold rAF + intro height share {@link CHART_INTRO_DURATION_MS}. */
  monospace: {
    seriesId: "nq-monospace-bar",
    collapsedScale: 0.1,
    expandedBandRatio: 0.72,
    collapseDelayMs: 700,
    foldDurationMs: CHART_INTRO_DURATION_MS,
    foldEasing: CHART_EASING.morph,
    introStaggerMs: 32,
    foldTauDivisor: 4,
    foldSettleEpsilon: 0.002,
    maxFrameDeltaMs: 32,
  },
  /**
   * Ceiling on accumulated per-mark delay. Half the intro keeps worst-case
   * settle at ~1.5× duration (~1.05s) instead of the previous ~2× — a long
   * category axis no longer trails after the rest of the chart has landed.
   */
  staggerCapMs: Math.round(CHART_INTRO_DURATION_MS / 2),
} as const;

export const NQ_MONOSPACE_SERIES_ID = CHART_ANIMATION.monospace.seriesId;

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function createStaggerDelay(staggerMs: number) {
  return (dataIndex: number) =>
    Math.min(dataIndex * staggerMs, CHART_ANIMATION.staggerCapMs);
}

export function seriesIndexStagger(seriesIndex: number, staggerMs: number) {
  return seriesIndex * staggerMs;
}

/** Target fold scale for a monospace bar (1 = expanded, collapsedScale = thin). */
export function monospaceTargetScale(
  collapsed: boolean,
  hoveredIndex: number | null,
  index: number,
): number {
  const { collapsedScale } = CHART_ANIMATION.monospace;
  return !collapsed || hoveredIndex === index ? 1 : collapsedScale;
}

/** Exponential ease step for monospace fold rAF — tuned to {@link CHART_ANIMATION.monospace.foldDurationMs}. */
export function stepMonospaceFold(current: number, target: number, dtMs: number): number {
  const { foldDurationMs, foldTauDivisor, foldSettleEpsilon } = CHART_ANIMATION.monospace;
  const tau = foldDurationMs / foldTauDivisor;
  const t = 1 - Math.exp(-dtMs / tau);
  const next = current + (target - current) * t;
  if (Math.abs(next - target) < foldSettleEpsilon) return target;
  return next;
}

/** ECharts series animation fields for monospace custom (height intro only; fold is rAF). */
export function monospaceSeriesAnimationFields() {
  const { bar, intro, monospace } = CHART_ANIMATION;
  return {
    animation: true,
    animationDuration: bar.duration,
    animationEasing: intro.easing,
    animationDelay: createStaggerDelay(monospace.introStaggerMs),
    animationDurationUpdate: 0,
    animationEasingUpdate: CHART_ANIMATION.monospace.foldEasing,
  };
}

/** setOption patch while rAF drives fold width — disables ECharts update tween. */
export function monospaceFoldPatchFields() {
  return {
    animation: false,
    animationDurationUpdate: 0,
  } as const;
}
