/**
 * The NQChart signature — one shape language for every chart family.
 *
 * Every compiler reads corners, gaps, strokes and symbol sizes from here
 * instead of carrying its own literals, so a dashboard of mixed charts reads
 * as one system. Two CSS variables theme the whole set:
 *
 * - `--radius` (nqui's base radius, 0.45rem by default) → corner radii.
 *   `mark` = `--radius-sm`, `surface` = `--radius-xl`, `join` = `mark`.
 * - `--chart-gap` (2px by default) → the seam between adjacent marks of one
 *   whole; stage gaps (funnel) are a multiple of it.
 *
 * Rules the tokens encode:
 * - Real space over painted seams: use geometry (pie `padAngle`, treemap
 *   `gapWidth`, custom-series insets); paint a background-colored border only
 *   where ECharts has no geometric gap.
 * - Radius never exceeds half the mark's short side (`clampRadius`).
 * - Strokes never grow on hover.
 *
 * @see plans/020-chart-signature-design-system.md
 */

import { readBaseRadiusPx } from "./chart-corner-radius";
import { headlessThemeOf } from "./headless-theme";

/** nqui's shipped `--radius` in px (0.45rem at a 16px root). */
const BASE_RADIUS_PX = 0.45 * 16;
/** `--radius-sm` = `calc(var(--radius) - 4px)`. */
const SM_DELTA_PX = -4;
/** `--radius-xl` = `calc(var(--radius) + 4px)`. */
const XL_DELTA_PX = 4;
/** Default `--chart-gap`. */
const DEFAULT_GAP_PX = 2;
/** Stage gaps (between funnel stages) are this many seams. */
const STAGE_GAP_MULTIPLE = 4;

export type ChartSignature = {
  radius: {
    /** Small marks: bars, cells, tiles. */
    mark: number;
    /** Large area marks: pie / donut / rose slices, treemap tiles, funnel ends. */
    surface: number;
    /** Where two pieces of one shape meet (funnel inner corners, stack seams). */
    join: number;
  };
  gap: {
    /** Between adjacent marks of one whole (slices, cells, tiles, segments). */
    seam: number;
    /** Between stages (funnel). */
    stage: number;
  };
  bar: { categoryGap: string; groupGap: string };
  stroke: { line: number; halo: number };
  symbol: { point: number; scatter: number };
  glow: { blur: number };
};

function fromBase(baseRadiusPx: number, gapPx: number): ChartSignature {
  const mark = Math.max(0, Math.round(baseRadiusPx + SM_DELTA_PX));
  const surface = Math.max(0, Math.round(baseRadiusPx + XL_DELTA_PX));
  const seam = Math.max(0, gapPx);
  return {
    radius: { mark, surface, join: mark },
    gap: { seam, stage: seam * STAGE_GAP_MULTIPLE },
    bar: { categoryGap: "28%", groupGap: "8%" },
    stroke: { line: 2, halo: 2 },
    symbol: { point: 6, scatter: 8 },
    glow: { blur: 14 },
  };
}

/** Build-time defaults (nqui's shipped tokens). Use on module-scope / SSR paths. */
export const CHART_SIGNATURE: ChartSignature = fromBase(BASE_RADIUS_PX, DEFAULT_GAP_PX);

/** Live `--chart-gap` in px for this chart, or null when unset / outside the browser. */
function readGapPx(chartId: string): number | null {
  const theme = headlessThemeOf(chartId);
  if (theme) return theme.chartGapPx ?? null;
  if (typeof document === "undefined") return null;
  const el =
    document.querySelector(`[data-chart="${chartId}"]`) ?? document.documentElement;
  const raw = getComputedStyle(el).getPropertyValue("--chart-gap").trim();
  const match = /^(-?[\d.]+)(px)?$/.exec(raw);
  if (!match?.[1]) return null;
  const n = Number.parseFloat(match[1]);
  return Number.isFinite(n) ? n : null;
}

/**
 * The signature for one chart, honoring the host's live `--radius` and
 * `--chart-gap` (or the registered headless theme).
 */
export function resolveChartSignature(chartId: string): ChartSignature {
  const base = readBaseRadiusPx(chartId);
  const gap = readGapPx(chartId);
  if (base === null && gap === null) return CHART_SIGNATURE;
  return fromBase(base ?? BASE_RADIUS_PX, gap ?? DEFAULT_GAP_PX);
}

/** Clamp a corner radius so it never exceeds half of a mark's short side. */
export function clampRadius(radius: number, shortSidePx: number): number {
  return Math.max(0, Math.min(radius, shortSidePx / 2));
}

/**
 * Pie / rose pad angle (degrees) that opens a `gapPx` seam at the outer edge
 * of a ring of radius `outerRadiusPx`.
 */
export function padAngleForGap(gapPx: number, outerRadiusPx: number): number {
  if (gapPx <= 0 || outerRadiusPx <= 0) return 0;
  return (gapPx / outerRadiusPx) * (180 / Math.PI);
}
