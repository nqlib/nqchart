/**
 * Corner radii for ECharts marks, derived from nqui's `--radius` scale.
 *
 * Canvas marks can't use CSS `border-radius`, so radii must reach ECharts as
 * numbers. Two layers:
 *
 * - The `*_PX` constants below are static fallbacks (nqui's shipped
 *   `--radius: 0.45rem` at a 16px root). They stay exported because several
 *   call sites need a value at module scope, before any DOM exists — default
 *   prop values, SSR, and tests.
 * - `resolveChartCornerRadius()` / `resolveChartBarCornerRadius()` read the
 *   live `--radius` off the chart container and honour the real root font
 *   size, so a host that retunes `--radius` (or a user who scales their
 *   browser font) gets matching chart corners. Prefer these on render paths.
 *
 * @see nqui/src/index.css
 */

/** nqui's shipped `--radius`, in rem. Fallback only — see `readBaseRadiusPx`. */
const NQUI_RADIUS_REM = 0.45;
const FALLBACK_ROOT_FONT_SIZE_PX = 16;

const nquiBaseRadiusPx = NQUI_RADIUS_REM * FALLBACK_ROOT_FONT_SIZE_PX;

/** `--radius-sm` is `calc(var(--radius) - 4px)`. */
const SM_DELTA_PX = -4;
/** `--radius-md` is `calc(var(--radius) - 2px)`. */
const MD_DELTA_PX = -2;

/**
 * `--radius-sm` — dense controls.
 * Default for cartesian bar columns; avoids semicircle tops on grouped bars
 * (ECharts clamps each corner to half the bar width).
 */
export const CHART_BAR_CORNER_RADIUS_PX = Math.round(nquiBaseRadiusPx + SM_DELTA_PX);

/**
 * `--radius-md` — default UI controls.
 * Used for radial caps, treemap tiles, and other larger marks.
 */
export const CHART_CORNER_RADIUS_PX = Math.round(nquiBaseRadiusPx + MD_DELTA_PX);

/** Parse a CSS length (`rem`/`em`/`px`) to px against a known root size. */
function lengthToPx(value: string, rootFontSizePx: number): number | null {
  const match = /^(-?[\d.]+)(rem|px|em)?$/.exec(value.trim());
  if (!match?.[1]) return null;
  const n = Number.parseFloat(match[1]);
  if (!Number.isFinite(n)) return null;
  // `em` on :root resolves against the root font size, same as `rem`.
  return match[2] === "px" ? n : n * rootFontSizePx;
}

/** Live `--radius` in px for this chart's subtree, or null outside the browser. */
function readBaseRadiusPx(chartId: string): number | null {
  if (typeof document === "undefined") return null;

  const el =
    document.querySelector(`[data-chart="${chartId}"]`) ?? document.documentElement;
  const raw = getComputedStyle(el).getPropertyValue("--radius").trim();
  if (!raw) return null;

  const rootFontSizePx =
    Number.parseFloat(getComputedStyle(document.documentElement).fontSize) ||
    FALLBACK_ROOT_FONT_SIZE_PX;

  return lengthToPx(raw, rootFontSizePx);
}

/** `--radius-md` resolved live; falls back to {@link CHART_CORNER_RADIUS_PX}. */
export function resolveChartCornerRadius(chartId: string): number {
  const base = readBaseRadiusPx(chartId);
  if (base === null) return CHART_CORNER_RADIUS_PX;
  return Math.max(0, Math.round(base + MD_DELTA_PX));
}

/** `--radius-sm` resolved live; falls back to {@link CHART_BAR_CORNER_RADIUS_PX}. */
export function resolveChartBarCornerRadius(chartId: string): number {
  const base = readBaseRadiusPx(chartId);
  if (base === null) return CHART_BAR_CORNER_RADIUS_PX;
  return Math.max(0, Math.round(base + SM_DELTA_PX));
}
