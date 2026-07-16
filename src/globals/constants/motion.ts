/**
 * Motion tokens — values copied from @nqlib/nqui `src/styles/motion.css` / MOTION.md.
 * Copied (not imported) so nqchart stays free of an @nqlib/nqui dependency.
 *
 * Chart intros use a separate duration below; UI chrome should stay on this scale.
 */

/* ─── Duration scale (ms) ─────────────────────────────────────────────── */

/** Instant — no animation. State toggles where motion would be a delay. */
export const DURATION_INSTANT_MS = 0;

/** Micro — hover, focus rings, button-press feedback. */
export const DURATION_MICRO_MS = 100;

/** Quick — DEFAULT. Most state changes: dropdowns, toggles, small reveals. */
export const DURATION_QUICK_MS = 150;

/** Standard — modal/sheet/drawer entries, page transitions, accordions. */
export const DURATION_STANDARD_MS = 200;

/** Slow — larger overlays, sheet from off-screen edge. */
export const DURATION_SLOW_MS = 250;

/** Dramatic — rare one-off attention moments. Never for routine state changes. */
export const DURATION_DRAMATIC_MS = 350;

/** @deprecated Prefer {@link DURATION_QUICK_MS}. */
export const MOTION_FAST_MS = DURATION_QUICK_MS;

/** @deprecated Prefer {@link DURATION_STANDARD_MS}. */
export const MOTION_STANDARD_MS = DURATION_STANDARD_MS;

/** @deprecated Prefer {@link DURATION_SLOW_MS}. */
export const MOTION_OVERLAY_MS = DURATION_SLOW_MS;

/* ─── Easing curves (nqui cubic-bezier) ───────────────────────────────── */

/** Ease-out — entrances / arrivals. `cubic-bezier(0.16, 1, 0.3, 1)` */
export const EASE_OUT = [0.16, 1, 0.3, 1] as const;

/** Ease-in — exits. `cubic-bezier(0.4, 0, 1, 1)` */
export const EASE_IN = [0.4, 0, 1, 1] as const;

/** Ease-in-out — neutral state changes. `cubic-bezier(0.4, 0, 0.2, 1)` */
export const EASE_IN_OUT = [0.4, 0, 0.2, 1] as const;

/** Spring-like CSS settle (subtle, not bouncy). `cubic-bezier(0.34, 1.2, 0.64, 1)` */
export const EASE_SPRING = [0.34, 1.2, 0.64, 1] as const;

export const EASE_OUT_CSS = "cubic-bezier(0.16, 1, 0.3, 1)";
export const EASE_IN_CSS = "cubic-bezier(0.4, 0, 1, 1)";
export const EASE_IN_OUT_CSS = "cubic-bezier(0.4, 0, 0.2, 1)";
export const EASE_SPRING_CSS = "cubic-bezier(0.34, 1.2, 0.64, 1)";

/**
 * Spring physics for motion/react (drag / nav settle).
 * Approximates nqui `--ease-spring` — subtle, not bouncy.
 */
export const SPRING = { stiffness: 180, damping: 20 } as const;

/* ─── Chart-only (outside nqui UI scale) ──────────────────────────────── */

/** Matches chart intro animation duration in chart-animation-tokens.ts. */
export const CHART_INTRO_DURATION_MS = 1200;
