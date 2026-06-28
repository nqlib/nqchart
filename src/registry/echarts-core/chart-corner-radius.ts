/**
 * nqui radius tokens in px at 16px root (`--radius: 0.45rem`).
 * @see nqui/src/index.css
 */
const NQUI_RADIUS_REM = 0.45;
const ROOT_FONT_SIZE_PX = 16;

const nquiBaseRadiusPx = NQUI_RADIUS_REM * ROOT_FONT_SIZE_PX;

/**
 * `--radius-sm` (calc(var(--radius) - 4px)) — dense controls.
 * Default for cartesian bar columns; avoids semicircle tops on grouped bars
 * (ECharts clamps each corner to half the bar width).
 */
export const CHART_BAR_CORNER_RADIUS_PX = Math.round(nquiBaseRadiusPx - 4);

/**
 * `--radius-md` (calc(var(--radius) - 2px)) — default UI controls.
 * Used for radial caps, treemap tiles, and other larger marks.
 */
export const CHART_CORNER_RADIUS_PX = Math.round(nquiBaseRadiusPx - 2);
