/**
 * Hover focus — ONE system for every chart.
 * Spec: src/content/docs/hover-focus.mdx (keep this file and that doc in sync).
 *
 * THE CONTRACT (identical for all charts):
 *   On hover, the focused mark group renders at full opacity; every other mark
 *   dims to HOVER_DIM_OPACITY. No scale, no shadow "pop" — the focus mechanism is
 *   always opacity. Nothing grows or jumps on hover. The opacity change fades over
 *   FOCUS.durationMs (one timing for every family; see FOCUS_INSTANT_FAMILIES).
 *   Pointer, keyboard and legend all go through `focusMark` (hover-focus-repair.ts).
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

/**
 * Focus tokens — the ONE dim level and the ONE state timing for every family and
 * every entry point (pointer hover, keyboard focus, legend isolate).
 *
 * - `dim`: opacity of every unfocused sibling.
 * - `durationMs` / `easing`: the blur ⇄ normal ⇄ emphasis state fade (ECharts
 *   `stateAnimation`). Geometry never tweens on focus (`animationDurationUpdate: 0`).
 */
export const FOCUS = {
  dim: 0.2,
  durationMs: 120,
  easing: "cubicOut",
} as const;

/** The one dim level. Alias of {@link FOCUS}.dim — kept for existing imports. */
export const HOVER_DIM_OPACITY = FOCUS.dim;

/** Every family that dims on focus. Used to look up a per-family timing fallback. */
export type FocusFamily =
  | "bar"
  | "line"
  | "area"
  | "composed"
  | "waterfall"
  | "pie"
  | "funnel"
  | "treemap"
  | "radial"
  | "scatter"
  | "radar"
  | "heatmap"
  | "calendar"
  | "tileColumn";

/**
 * Per-family fallback to an instant (0 ms) focus fade.
 *
 * The signature is the calm {@link FOCUS}.durationMs fade everywhere. A family goes
 * here ONLY when the fade reintroduces a regression recorded under
 * `.agents/skills/fixed/` (flicker, vanish, stuck blur) — cite the fix note beside it.
 * Verified 2026-11-06 in the browser on pie, funnel, treemap, waterfall, scatter,
 * radial and bar: no family needed the fallback.
 */
export const FOCUS_INSTANT_FAMILIES: Readonly<Partial<Record<FocusFamily, true>>> = {};

/** ECharts `stateAnimation` for a focus preset — the one timing, or 0 for a fallback family. */
export function focusStateAnimation(family?: FocusFamily): {
  duration: number;
  easing: typeof FOCUS.easing;
} {
  const instant = family != null && FOCUS_INSTANT_FAMILIES[family] === true;
  return { duration: instant ? 0 : FOCUS.durationMs, easing: FOCUS.easing };
}

/**
 * Series-level focus timing: the state fade plus no geometry tween on hover.
 * Spread into every focus preset; `apply-chart-animation.ts` re-asserts it.
 */
/**
 * Custom series focus. ECharts reads `focus` / `blurScope` from the element a
 * `renderItem` returns (CustomView `createOrUpdateItem` → `toggleHoverEmphasis(el,
 * elOption.focus, …)`), NOT from `series.emphasis` — a series-level preset alone
 * never dims siblings. Spread this onto the returned group.
 */
export function customFocusGroup(enabled: boolean) {
  return enabled
    ? { focus: "self" as const, blurScope: "series" as const }
    : { emphasisDisabled: true as const };
}

/**
 * Per-child states for a custom-series group: blurred siblings fade to
 * {@link FOCUS}.dim; the hovered mark keeps its look.
 *
 * `fill: "inherit"` is ECharts' "keep the normal fill" marker. Without it,
 * hover runs `liftColor` on the fill, which only parses plain color strings: a
 * CSS-variable / oklch fill lifts to nothing and the hovered mark VANISHES
 * (radial rose, 2026-11). It also honors the signature rule that the hovered
 * mark never changes color.
 */
export function customFocusChild(enabled: boolean) {
  return enabled
    ? { blur: { style: { opacity: FOCUS.dim } }, emphasis: { style: { fill: "inherit" } } }
    : {};
}

export function focusTiming(family?: FocusFamily) {
  return {
    stateAnimation: focusStateAnimation(family),
    animationDurationUpdate: 0,
  };
}

/** Compiled when `hoverFocus={false}` — tooltip stays, sibling dim does not. */
export const HOVER_FOCUS_OFF = {
  emphasis: { disabled: true as const },
};

export function isHoverFocusOn(ctx: { hoverFocus?: boolean }): boolean {
  return ctx.hoverFocus !== false;
}

/**
 * Apply a focus preset, or disable native emphasis when the host opted out.
 * Default (omit / true) keeps today’s dim-on-hover.
 *
 * Native-emphasis presets (area/line/bar/…) set `emphasis.disabled: false`
 * so a later `hoverFocus={true}` overwrites Off via ECharts setOption merge.
 * Pie/funnel/treemap/waterfall/radial keep `disabled: true` and dim via repair.
 */
export function hoverFocusOrOff<T extends Record<string, unknown>>(
  enabled: boolean,
  focus: T,
): T | typeof HOVER_FOCUS_OFF {
  return enabled ? focus : HOVER_FOCUS_OFF;
}

const INDEX_FOCUS = {
  focus: "self" as const,
  blurScope: "coordinateSystem" as const,
  scale: false as const,
  // Explicit false so setOption merge can undo `hoverFocus={false}` (`disabled: true`).
  // Omitting the key leaves the previous disabled flag in place until remount.
  disabled: false as const,
};

const ITEM_FOCUS = {
  focus: "self" as const,
  blurScope: "series" as const,
  scale: false as const,
  disabled: false as const,
};

/* ─────────────────────────── Shared-axis cartesian ─────────────────────────── */

/** Bar / waterfall columns — itemStyle-only blur (lineStyle blur corrupts columns). */
export function cartesianColumnFocus(color?: string, family: FocusFamily = "bar") {
  return {
    blur: { itemStyle: { opacity: HOVER_DIM_OPACITY } },
    emphasis: {
      ...INDEX_FOCUS,
      itemStyle: { opacity: 1, ...(color ? { color } : {}) },
    },
    ...focusTiming(family),
  };
}

/**
 * Waterfall value bars — index focus, signature focus timing.
 * Stacked placeholder + values series races native high-down; NQChart owns hover in
 * `hover-focus-repair.ts` (waterfall adapter; same pattern as funnel/treemap).
 */
export function waterfallColumnFocus() {
  const focus = cartesianColumnFocus(undefined, "waterfall");
  return {
    ...focus,
    emphasis: {
      ...focus.emphasis,
      disabled: true,
    },
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
  /** Timing family (default `line`; area/composed pass their own). */
  family?: FocusFamily;
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
    ...focusTiming(opts.family ?? (hasArea ? "area" : "line")),
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
  /** Timing family — selects a per-family instant fallback. */
  family?: FocusFamily;
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
    ...focusTiming(opts?.family),
  };
}

/**
 * Concentric radial / rose — one ECharts series per ring or petal.
 * `focus:"series"` avoids per-segment hit-testing across ring gaps (flicker).
 * `emphasis.disabled` turns off native high-down; NQChart applies focus in
 * `hover-focus-repair.ts` (radial adapter).
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
    ...focusTiming("radial"),
  };
}

/**
 * Treemap tiles — item focus; layout never tweens on hover.
 * ECharts defaults to animationDurationUpdate 900ms; hover re-layout causes flicker
 * (fixed/hover-focus-treemap-flicker-vanish) — `focusTiming` pins it to 0.
 * `emphasis.disabled` turns off ECharts native blur/emphasis; NQChart applies focus in
 * `hover-focus-repair.ts` (treemap adapter) to avoid fighting the built-in high-down pipeline.
 */
export function treemapFocus() {
  const focus = itemFocus({ dimLabel: true, family: "treemap" });
  return {
    ...focus,
    emphasis: {
      ...focus.emphasis,
      disabled: true,
    },
  };
}

/**
 * Funnel stages — item focus, signature focus timing, no geometry tween.
 * Native high-down races NQChart blur sync on adjacent segments; NQChart owns hover in
 * `hover-focus-repair.ts` (funnel adapter; same pattern as treemap).
 */
export function funnelFocus(family: FocusFamily = "funnel") {
  const focus = itemFocus({ dimLabel: true, family });
  return {
    ...focus,
    emphasis: {
      ...focus.emphasis,
      disabled: true,
    },
  };
}

/**
 * Pie slices — same adjacent-segment race as funnel (native high-down + blur sync).
 * NQChart owns hover in `hover-focus-repair.ts` (pie adapter).
 */
export function pieFocus() {
  return funnelFocus("pie");
}

/** Minimum arc sweep (degrees) so short radial bars stay hoverable. */
export const RADIAL_BAR_MIN_ANGLE = 8;
