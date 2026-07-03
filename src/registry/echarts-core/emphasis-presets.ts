/**
 * Hover focus — ONE system for every chart.
 * Spec: src/content/docs/hover-focus.mdx (keep this file and that doc in sync).
 *
 * THE CONTRACT (identical for all charts):
 *   On hover, the focused mark group renders at full opacity; every other mark
 *   dims to HOVER_DIM_OPACITY. No scale, no shadow "pop" — the focus mechanism is
 *   always opacity. Nothing grows or jumps on hover.
 *
 * Two ECharts mappings of the SAME contract (chosen by geometry, not by taste):
 *   - Shared-axis cartesian (bar, line, area, composed, waterfall): INDEX focus.
 *     focus:"self" + blurScope:"coordinateSystem" → hovering a category keeps that
 *     column bright and dims the rest. Axis tooltip drives it.
 *   - Per-point item charts (pie, funnel, scatter, …): ITEM focus via itemFocus().
 *     focus:"self" + blurScope:"series". Scatter merges `<Scatter />` into one series
 *     and duplicates itemFocus on each object row (Symbol hasItemOption quirk).
 *   - Polar bar / rose (concentric rings, petals): SERIES focus.
 *     one series per ring + focus:"series" → see radialBarSeriesFocus().
 *
 * Flicker control lives in echarts-tooltip.ts (tooltip is pointer-events:none,
 * offset from the cursor, transition 0) so the pointer never lands on tooltip DOM.
 *
 * Per-series-type blur SHAPES (which of itemStyle/lineStyle/areaStyle carry the
 * opacity) exist only to dodge ECharts render bugs, never to vary the look:
 * lineStyle/areaStyle opacity blur corrupts bar columns, and throws if you blur
 * areaStyle blur throws on lines-only radars. The opacity value and focus mode
 * are constant everywhere.
 *
 * `shadowBlur` is the ONE sanctioned exception: it is the signature of the explicit
 * "*-glow" variants only (area-glow, scatter-glow, radar-glow). Default charts pass
 * nothing and therefore never pop.
 */

/** The one dim level. Everything not focused fades to this on hover. */
export const HOVER_DIM_OPACITY = 0.2;

const INDEX_FOCUS = {
  focus: "self" as const,
  blurScope: "coordinateSystem" as const,
  scale: false as const,
};

const ITEM_FOCUS = {
  focus: "self" as const,
  blurScope: "series" as const,
  scale: false as const,
};

/* ─────────────────────────── Shared-axis cartesian ─────────────────────────── */

/** Bar / waterfall columns — itemStyle-only blur (lineStyle blur corrupts columns). */
export function cartesianColumnFocus(color?: string) {
  return {
    blur: { itemStyle: { opacity: HOVER_DIM_OPACITY } },
    emphasis: {
      ...INDEX_FOCUS,
      itemStyle: { opacity: 1, ...(color ? { color } : {}) },
    },
  };
}

/**
 * Waterfall value bars — index focus with instant state updates.
 * Stacked placeholder + values series races native high-down; NQChart owns hover in
 * `waterfall-hover-focus.ts` (same pattern as funnel/treemap).
 */
export function waterfallColumnFocus() {
  const focus = cartesianColumnFocus();
  return {
    ...focus,
    emphasis: {
      ...focus.emphasis,
      disabled: true,
    },
    stateAnimation: { duration: 0 },
    animationDurationUpdate: 0,
  };
}

/** Line / area — itemStyle + lineStyle (+ areaStyle when filled) blur. */
export function cartesianLineFocus(opts: {
  color: string;
  lineWidth?: number;
  borderColor?: string;
  borderWidth?: number;
  areaStyle?: Record<string, unknown>;
  /** area-glow variant only. */
  shadowBlur?: number;
}) {
  const hasArea = opts.areaStyle != null;
  return {
    blur: {
      itemStyle: { opacity: HOVER_DIM_OPACITY },
      lineStyle: { opacity: HOVER_DIM_OPACITY },
      ...(hasArea ? { areaStyle: { opacity: HOVER_DIM_OPACITY } } : {}),
    },
    emphasis: {
      ...INDEX_FOCUS,
      lineStyle: {
        color: opts.color,
        width: opts.lineWidth ?? 2,
        ...(opts.shadowBlur ? { shadowBlur: opts.shadowBlur, shadowColor: opts.color } : {}),
      },
      itemStyle: {
        color: opts.color,
        opacity: 1,
        ...(opts.borderColor
          ? { borderColor: opts.borderColor, borderWidth: opts.borderWidth ?? 2 }
          : {}),
        ...(opts.shadowBlur ? { shadowBlur: opts.shadowBlur, shadowColor: opts.color } : {}),
      },
      ...(hasArea ? { areaStyle: opts.areaStyle } : {}),
    },
  };
}

/* ───────────────────────────── Single-series items ─────────────────────────── */

/**
 * Item charts (pie, funnel, radar, heatmap, treemap, calendar, radial).
 * Hovered segment full opacity, siblings dim to HOVER_DIM_OPACITY.
 *
 * @param opts.blurLine   also dim lineStyle (radar polygons).
 * @param opts.dimLabel   also dim labels (pie / funnel render inline labels).
 * @param opts.shadowBlur "*-glow" variants only — adds the signature glow.
 * @param opts.label      emphasis label overrides (rare).
 */
export function itemFocus(opts?: {
  blurLine?: boolean;
  dimLabel?: boolean;
  shadowBlur?: number;
  label?: Record<string, unknown>;
}) {
  const blur: Record<string, unknown> = {
    itemStyle: { opacity: HOVER_DIM_OPACITY },
  };
  if (opts?.blurLine) blur.lineStyle = { opacity: HOVER_DIM_OPACITY };
  if (opts?.dimLabel) blur.label = { opacity: HOVER_DIM_OPACITY };

  return {
    blur,
    emphasis: {
      ...ITEM_FOCUS,
      // Pin the focused item to full opacity. Without this the sibling blur
      // (opacity 0.2) bleeds onto the hovered item on some series types (notably
      // polar bars), dimming everything. Mirrors cartesianColumnFocus.
      itemStyle: { opacity: 1, ...(opts?.shadowBlur ? { shadowBlur: opts.shadowBlur } : {}) },
      ...(opts?.label ? { label: opts.label } : {}),
    },
  };
}

/**
 * Concentric radial / rose — one ECharts series per ring or petal.
 * `focus:"series"` avoids per-segment hit-testing across ring gaps (flicker).
 * Instant state transitions — gradient fills cannot tween safely.
 * `emphasis.disabled` turns off native high-down; NQChart applies focus in
 * `radial-hover-focus.ts`.
 */
export function radialBarSeriesFocus() {
  return {
    blur: { itemStyle: { opacity: HOVER_DIM_OPACITY } },
    emphasis: {
      focus: "series" as const,
      scale: false as const,
      disabled: true,
      // Pin focused ring to full opacity — sibling blur bleeds otherwise.
      itemStyle: { opacity: 1 },
    },
    stateAnimation: { duration: 0 },
    animationDurationUpdate: 0,
  };
}

/**
 * Treemap tiles — item focus with instant state + layout updates.
 * ECharts defaults to animationDurationUpdate 900ms; hover re-layout causes flicker.
 * `emphasis.disabled` turns off ECharts native blur/emphasis; NQChart applies focus in
 * `treemap-hover-focus.ts` to avoid fighting the built-in high-down pipeline.
 */
export function treemapFocus() {
  const focus = itemFocus({ dimLabel: true });
  return {
    ...focus,
    emphasis: {
      ...focus.emphasis,
      disabled: true,
    },
    stateAnimation: { duration: 0 },
    animationDurationUpdate: 0,
  };
}

/**
 * Funnel stages — item focus with instant state updates.
 * Native high-down races NQChart blur sync on adjacent segments; NQChart owns hover in
 * `funnel-hover-focus.ts` (same pattern as treemap).
 */
export function funnelFocus() {
  const focus = itemFocus({ dimLabel: true });
  return {
    ...focus,
    emphasis: {
      ...focus.emphasis,
      disabled: true,
    },
    stateAnimation: { duration: 0 },
    animationDurationUpdate: 0,
  };
}

/** Minimum arc sweep (degrees) so short radial bars stay hoverable. */
export const RADIAL_BAR_MIN_ANGLE = 8;
