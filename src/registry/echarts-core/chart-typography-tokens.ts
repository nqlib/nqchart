/**
 * Single source of truth for NQChart canvas typography.
 *
 * ECharts paints to canvas/SVG, so it cannot inherit CSS `font-family` or
 * `font-size` the way DOM chrome does. These tokens mirror the nqui type scale
 * (`--font-sans`, Tailwind `text-xs`/`text-sm`) so text *inside* a chart matches
 * text *beside* it.
 *
 * Font family is resolved at runtime from `--font-sans` on the chart container
 * (see `resolveChartFontFamily`), the same live-token bridge used for colors in
 * `resolve-chart-chrome.ts`. Sizes are static because the canvas has no
 * equivalent of `rem` inheritance.
 *
 * Applied in `apply-chart-chrome.ts` via `applyChartChromeToOption()`.
 */

/**
 * Fallback stack when `--font-sans` is unavailable (SSR, or a host that never
 * defined the token). Mirrors nqui's `--font-sans: 'Inter Variable', sans-serif`
 * with the usual system fallbacks appended.
 * @see nqui/src/index.css
 */
export const CHART_FONT_FAMILY_FALLBACK =
  "'Inter Variable', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif";

/** Monospace stack for numeric/tabular readouts (hover trace values). */
export const CHART_FONT_FAMILY_MONO =
  "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace";

/**
 * Size ramp — mirrors the nqui/Tailwind scale in px at a 16px root.
 * `text-xs` = 12px, and 10/11 are the sub-xs steps ECharts needs for dense
 * in-mark labels where 12px would collide.
 */
export const CHART_FONT_SIZE = {
  /** 10px — dense in-mark labels (treemap leaves) where space is tightest. */
  micro: 10,
  /** 11px — in-mark labels with moderate room (funnel, radial, hover trace). */
  small: 11,
  /** 12px — `text-xs`. DEFAULT for axis labels, legends, tooltips, pie labels. */
  base: 12,
  /** 20px — large centered readouts (gauge value). */
  display: 20,
} as const;

/**
 * Weight ramp — mirrors nqui's `font-medium` / `font-semibold`.
 * Canvas text has no variable-font axis wiring, so these are numeric.
 */
export const CHART_FONT_WEIGHT = {
  /** 400 — body/axis default. */
  normal: 400,
  /** 500 — `font-medium`. In-mark labels that need to hold against a fill. */
  medium: 500,
  /** 600 — `font-semibold`. Emphasis values, parent/group headers. */
  semibold: 600,
} as const;

/**
 * Named roles — prefer these over raw {@link CHART_FONT_SIZE} at call sites so
 * intent survives a retune.
 */
export const CHART_TYPOGRAPHY = {
  /** Axis tick labels, legend entries, native tooltip body. */
  axis: {
    fontSize: CHART_FONT_SIZE.base,
    fontWeight: CHART_FONT_WEIGHT.normal,
  },
  /** Labels drawn on top of a saturated series fill (funnel, radial, pie). */
  markLabel: {
    fontSize: CHART_FONT_SIZE.small,
    fontWeight: CHART_FONT_WEIGHT.medium,
  },
  /** Dense in-mark labels where `markLabel` would overflow (treemap leaves). */
  markLabelDense: {
    fontSize: CHART_FONT_SIZE.micro,
    fontWeight: CHART_FONT_WEIGHT.medium,
  },
  /** Group/parent headers and emphasized values inside marks. */
  markEmphasis: {
    fontSize: CHART_FONT_SIZE.small,
    fontWeight: CHART_FONT_WEIGHT.semibold,
  },
  /** Pie slice labels — `text-xs`, sits outside the fill. */
  sliceLabel: {
    fontSize: CHART_FONT_SIZE.base,
    fontWeight: CHART_FONT_WEIGHT.normal,
  },
  /** Large centered readout (gauge value). */
  display: {
    fontSize: CHART_FONT_SIZE.display,
    fontWeight: CHART_FONT_WEIGHT.semibold,
  },
  /** Gauge caption under the display value. */
  displayCaption: {
    fontSize: CHART_FONT_SIZE.base,
    fontWeight: CHART_FONT_WEIGHT.normal,
  },
  /** Numeric hover-trace readout — monospace so digits don't jitter. */
  traceValue: {
    fontSize: CHART_FONT_SIZE.small,
    fontWeight: CHART_FONT_WEIGHT.semibold,
    fontFamily: CHART_FONT_FAMILY_MONO,
  },
} as const;
