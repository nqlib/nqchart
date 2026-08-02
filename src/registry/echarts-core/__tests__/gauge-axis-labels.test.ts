import { describe, expect, it } from "vitest";
import {
  formatGaugeAxisLabel,
  gaugeLabelsCollide,
  GAUGE_SPLIT_NUMBER,
  resolveGaugeLabelLayout,
} from "../gauge-axis-labels";
import { compileRadialOption } from "../compile-radial";
import { CHART_FONT_SIZE } from "../chart-typography-tokens";
import type { GaugePart } from "../parts/types";
import { makeCtx } from "./make-ctx";

const gaugePart: GaugePart = {
  type: "gauge",
  id: "gauge-1",
  dataKey: "value",
};

describe("gaugeLabelsCollide", () => {
  it("detects crown collisions when every tick is labeled on a small dial", () => {
    expect(
      gaugeLabelsCollide({
        width: 300,
        height: 220,
        min: 0,
        max: 100,
        splitNumber: 10,
        stride: 1,
        fontSize: CHART_FONT_SIZE.base,
        sweepDeg: 180,
        radiusRatio: 0.75,
        labelDistance: 15,
        splitLineLength: 10,
      }),
    ).toBe(true);
  });

  it("clears collisions when labels alternate", () => {
    expect(
      gaugeLabelsCollide({
        width: 300,
        height: 220,
        min: 0,
        max: 100,
        splitNumber: 10,
        stride: 2,
        fontSize: CHART_FONT_SIZE.base,
        sweepDeg: 180,
        radiusRatio: 0.75,
        labelDistance: 15,
        splitLineLength: 10,
      }),
    ).toBe(false);
  });
});

describe("resolveGaugeLabelLayout", () => {
  it("keeps dense labels on a wide dial", () => {
    const layout = resolveGaugeLabelLayout({ width: 720, height: 480 });
    expect(layout.stride).toBe(1);
    expect(layout.fontSize).toBe(CHART_FONT_SIZE.base);
  });

  it("shrinks font at stride 1 before jumping to alternate labels", () => {
    // short≈260: 12px crown boxes collide; 10px clears — must not jump to stride 2.
    const viewport = { width: 400, height: 260 };
    const baseCollides = gaugeLabelsCollide({
      ...viewport,
      min: 0,
      max: 100,
      splitNumber: 10,
      stride: 1,
      fontSize: CHART_FONT_SIZE.base,
      sweepDeg: 180,
      radiusRatio: 0.75,
      labelDistance: 15,
      splitLineLength: 10,
    });
    const microFits = !gaugeLabelsCollide({
      ...viewport,
      min: 0,
      max: 100,
      splitNumber: 10,
      stride: 1,
      fontSize: CHART_FONT_SIZE.micro,
      sweepDeg: 180,
      radiusRatio: 0.75,
      labelDistance: 15,
      splitLineLength: 10,
    });
    expect(baseCollides).toBe(true);
    expect(microFits).toBe(true);

    const layout = resolveGaugeLabelLayout(viewport);
    expect(layout.stride).toBe(1);
    expect(layout.fontSize).toBeLessThan(CHART_FONT_SIZE.base);
  });

  it("thins to alternate labels on card-sized viewports", () => {
    const card = resolveGaugeLabelLayout({ width: 320, height: 240 });
    expect(card.stride).toBeGreaterThanOrEqual(2);
  });

  it("thins further on tiny viewports", () => {
    const layout = resolveGaugeLabelLayout({ width: 160, height: 120 });
    expect(layout.stride).toBe(4);
  });
});

describe("formatGaugeAxisLabel", () => {
  const base = { min: 0, max: 100, splitNumber: GAUGE_SPLIT_NUMBER, stride: 2 as const };

  it("keeps ends and every other tick", () => {
    expect(formatGaugeAxisLabel(0, base)).toBe("0");
    expect(formatGaugeAxisLabel(10, base)).toBe("");
    expect(formatGaugeAxisLabel(20, base)).toBe("20");
    expect(formatGaugeAxisLabel(30, base)).toBe("");
    expect(formatGaugeAxisLabel(100, base)).toBe("100");
  });

  it("shows all ticks when stride is 1", () => {
    const opts = { ...base, stride: 1 };
    expect(formatGaugeAxisLabel(10, opts)).toBe("10");
    expect(formatGaugeAxisLabel(50, opts)).toBe("50");
  });
});

describe("compileGaugeOption label thinning", () => {
  it("emits layout token id + formatter for card viewports", () => {
    const option = compileRadialOption(
      makeCtx({
        parts: [gaugePart],
        nameKey: "series",
        data: [{ series: "score", value: 72 }],
        viewport: { width: 300, height: 220 },
      }),
    );
    const series = option.series as Array<{
      type?: string;
      id?: string;
      axisLabel?: { fontSize?: number; formatter?: (v: number) => string };
    }>;
    const dial = series[0];
    const layout = resolveGaugeLabelLayout({ width: 300, height: 220 });
    expect(dial?.id).toBe(`__gauge_dial_s${layout.stride}_f${layout.fontSize}__`);
    expect(dial?.axisLabel?.fontSize).toBe(layout.fontSize);
    expect(dial?.axisLabel?.formatter?.(10)).toBe("");
    expect(dial?.axisLabel?.formatter?.(20)).toBe("20");
    expect(dial?.axisLabel?.formatter?.(0)).toBe("0");
    expect(dial?.axisLabel?.formatter?.(100)).toBe("100");
  });

  it("keeps dense labels when the viewport is large", () => {
    const option = compileRadialOption(
      makeCtx({
        parts: [gaugePart],
        nameKey: "series",
        data: [{ series: "score", value: 72 }],
        viewport: { width: 720, height: 480 },
      }),
    );
    const series = option.series as Array<{
      id?: string;
      axisLabel?: { fontSize?: number; formatter?: (v: number) => string };
    }>;
    expect(series[0]?.id).toBe(`__gauge_dial_s1_f${CHART_FONT_SIZE.base}__`);
    expect(series[0]?.axisLabel?.fontSize).toBe(CHART_FONT_SIZE.base);
    expect(series[0]?.axisLabel?.formatter?.(10)).toBe("10");
  });

  it("recompiles to a different series id when the viewport shrinks", () => {
    const large = compileRadialOption(
      makeCtx({
        parts: [gaugePart],
        nameKey: "series",
        data: [{ series: "score", value: 72 }],
        viewport: { width: 720, height: 480 },
      }),
    );
    const small = compileRadialOption(
      makeCtx({
        parts: [gaugePart],
        nameKey: "series",
        data: [{ series: "score", value: 72 }],
        viewport: { width: 300, height: 220 },
      }),
    );
    const largeId = (large.series as Array<{ id?: string }>)[0]?.id;
    const smallId = (small.series as Array<{ id?: string }>)[0]?.id;
    expect(largeId).not.toBe(smallId);
    expect(smallId).toMatch(/__gauge_dial_s[24]_f\d+__/);
  });
});
