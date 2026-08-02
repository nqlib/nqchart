/**
 * Guards the nqchart ↔ nqui design-token alignment.
 *
 * These assertions encode decisions, not implementation details: if someone
 * retunes chart motion or typography away from the nqui vocabulary, this test
 * should fail and force the change to be deliberate.
 */
import { describe, expect, it } from "vitest";
import {
  CHART_EASE_IN_OUT,
  CHART_EASE_OUT,
  CHART_EASING,
  CHART_INTRO_DURATION_MS,
  CHART_UPDATE_DURATION_MS,
  CHART_ANIMATION,
  createStaggerDelay,
} from "../chart-animation-tokens";
import {
  CHART_FONT_SIZE,
  CHART_FONT_WEIGHT,
  CHART_TYPOGRAPHY,
} from "../chart-typography-tokens";

/** nqui motion.css `--ease-out` / `--ease-in-out`. */
const NQUI_EASE_OUT = [0.16, 1, 0.3, 1];
const NQUI_EASE_IN_OUT = [0.4, 0, 0.2, 1];

/** zrender only recognises a bezier easing in this exact literal form. */
const ZRENDER_CUBIC_BEZIER = /^cubic-bezier\(([0-9,.e ]+)\)$/;

function bezierPoints(easing: unknown): number[] {
  const match = ZRENDER_CUBIC_BEZIER.exec(String(easing));
  if (!match?.[1]) throw new Error(`not a zrender-parsable bezier: ${String(easing)}`);
  return match[1].split(",").map((n) => Number.parseFloat(n.trim()));
}

describe("easing matches the nqui motion vocabulary", () => {
  it("uses nqui --ease-out for entrances and updates", () => {
    expect(bezierPoints(CHART_EASE_OUT)).toEqual(NQUI_EASE_OUT);
    expect(bezierPoints(CHART_EASING.intro)).toEqual(NQUI_EASE_OUT);
    expect(bezierPoints(CHART_EASING.update)).toEqual(NQUI_EASE_OUT);
  });

  it("uses nqui --ease-in-out for morph/fold/line-draw", () => {
    expect(bezierPoints(CHART_EASE_IN_OUT)).toEqual(NQUI_EASE_IN_OUT);
    expect(bezierPoints(CHART_EASING.morph)).toEqual(NQUI_EASE_IN_OUT);
  });

  it("stays in the string form zrender can parse", () => {
    // A [x1,y1,x2,y2] tuple type-checks against the option surface but silently
    // degrades to linear at runtime — the regression this pins.
    for (const easing of Object.values(CHART_EASING)) {
      expect(String(easing)).toMatch(ZRENDER_CUBIC_BEZIER);
    }
  });
});

describe("duration stays in the nqui family", () => {
  it("keeps the intro within a chart-appropriate multiple of nqui's ceiling", () => {
    // nqui --duration-dramatic (350ms) is its slowest token. A data intro may
    // exceed it (it carries meaning), but not by the 3.4x the old 1200ms did.
    expect(CHART_INTRO_DURATION_MS).toBeLessThanOrEqual(350 * 2);
  });

  it("keeps updates at half the intro", () => {
    expect(CHART_UPDATE_DURATION_MS).toBe(CHART_INTRO_DURATION_MS / 2);
  });

  it("caps worst-case settle at ~1.5x the intro", () => {
    const worstCase = CHART_ANIMATION.staggerCapMs + CHART_INTRO_DURATION_MS;
    expect(worstCase).toBeLessThanOrEqual(CHART_INTRO_DURATION_MS * 1.5);
  });

  it("clamps a long category axis to the stagger cap", () => {
    const delay = createStaggerDelay(CHART_ANIMATION.bar.staggerMs);
    expect(delay(500)).toBe(CHART_ANIMATION.staggerCapMs);
    expect(delay(0)).toBe(0);
  });
});

describe("typography mirrors the nqui type scale", () => {
  it("defaults axis/legend/tooltip text to text-xs (12px)", () => {
    expect(CHART_TYPOGRAPHY.axis.fontSize).toBe(12);
    expect(CHART_FONT_SIZE.base).toBe(12);
  });

  it("uses only nqui font weights", () => {
    const allowed = Object.values(CHART_FONT_WEIGHT);
    for (const role of Object.values(CHART_TYPOGRAPHY)) {
      if ("fontWeight" in role) expect(allowed).toContain(role.fontWeight);
    }
  });

  it("uses only sizes from the ramp", () => {
    const allowed = Object.values(CHART_FONT_SIZE);
    for (const role of Object.values(CHART_TYPOGRAPHY)) {
      expect(allowed).toContain(role.fontSize);
    }
  });
});

describe("font-family bridge", () => {
  it("falls back to the Inter stack outside the browser (SSR)", async () => {
    // vitest runs this suite in the `node` environment, so `document` is
    // undefined here — this is the real SSR path, not a mock.
    expect(typeof document).toBe("undefined");
    const { resolveChartFontFamily } = await import("../resolve-chart-chrome");
    const { CHART_FONT_FAMILY_FALLBACK } = await import("../chart-typography-tokens");
    expect(resolveChartFontFamily("any-chart")).toBe(CHART_FONT_FAMILY_FALLBACK);
  });

  it("ships a generic fallback so canvas never hits the UA default", async () => {
    const { CHART_FONT_FAMILY_FALLBACK, CHART_FONT_FAMILY_MONO } = await import(
      "../chart-typography-tokens"
    );
    expect(CHART_FONT_FAMILY_FALLBACK).toMatch(/Inter Variable/);
    expect(CHART_FONT_FAMILY_FALLBACK).toMatch(/sans-serif$/);
    expect(CHART_FONT_FAMILY_MONO).toMatch(/monospace$/);
  });

  it("routes numeric hover-trace readouts through the mono stack", async () => {
    const { CHART_TYPOGRAPHY, CHART_FONT_FAMILY_MONO } = await import(
      "../chart-typography-tokens"
    );
    expect(CHART_TYPOGRAPHY.traceValue.fontFamily).toBe(CHART_FONT_FAMILY_MONO);
  });
});
