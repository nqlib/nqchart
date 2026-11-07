import { describe, expect, it } from "vitest";
import type { EChartsOption } from "echarts";
import { applyChartAnimationToOption, withFocusTiming } from "../apply-chart-animation";
import { compileRadarOption } from "../compile-radar";
import { compileScatterOption } from "../compile-scatter";
import {
  FOCUS,
  FOCUS_INSTANT_FAMILIES,
  HOVER_DIM_OPACITY,
  cartesianColumnFocus,
  cartesianLineFocus,
  focusStateAnimation,
  funnelFocus,
  itemFocus,
  pieFocus,
  radialBarSeriesFocus,
  treemapFocus,
  waterfallColumnFocus,
} from "../emphasis-presets";
import { withLegendFocus } from "../legend-focus";
import { makeCtx } from "./make-ctx";

const SIGNATURE = { duration: FOCUS.durationMs, easing: FOCUS.easing };

describe("FOCUS tokens", () => {
  it("one dim, one calm fade", () => {
    expect(FOCUS).toEqual({ dim: 0.2, durationMs: 120, easing: "cubicOut" });
    expect(HOVER_DIM_OPACITY).toBe(FOCUS.dim);
  });

  it("no family falls back to an instant fade today", () => {
    expect(FOCUS_INSTANT_FAMILIES).toEqual({});
    expect(focusStateAnimation("pie")).toEqual(SIGNATURE);
  });
});

describe("every focus preset carries the unified timing", () => {
  const presets: Record<string, Record<string, unknown>> = {
    cartesianColumnFocus: cartesianColumnFocus("red"),
    cartesianLineFocus: cartesianLineFocus({ color: "red" }),
    cartesianAreaFocus: cartesianLineFocus({ color: "red", areaStyle: { opacity: 0.4 } }),
    waterfallColumnFocus: waterfallColumnFocus(),
    itemFocus: itemFocus(),
    radialBarSeriesFocus: radialBarSeriesFocus(),
    treemapFocus: treemapFocus(),
    funnelFocus: funnelFocus(),
    pieFocus: pieFocus(),
  };

  for (const [name, preset] of Object.entries(presets)) {
    it(name, () => {
      expect(preset.stateAnimation).toEqual(SIGNATURE);
      // No geometry tween on focus (fixed/hover-focus-treemap-flicker-vanish).
      expect(preset.animationDurationUpdate).toBe(0);
    });
  }

  it("repair families keep native emphasis disabled", () => {
    for (const preset of [waterfallColumnFocus(), radialBarSeriesFocus(), treemapFocus(), funnelFocus(), pieFocus()]) {
      expect((preset.emphasis as { disabled?: boolean }).disabled).toBe(true);
    }
  });
});

describe("withFocusTiming", () => {
  it("covers per-item focus (radar polygons) after the animation pass", () => {
    const option = applyChartAnimationToOption(
      compileRadarOption(
        makeCtx({
          parts: [{ type: "radar", id: "r", dataKey: "a" }],
          xDataKey: "axis",
          data: [
            { axis: "x", a: 1 },
            { axis: "y", a: 2 },
            { axis: "z", a: 3 },
          ],
        } as never),
      ),
    );
    const series = (option.series as Array<Record<string, unknown>>)[0]!;
    expect(series.stateAnimation).toEqual(SIGNATURE);
    expect(series.animationDurationUpdate).toBe(0);
  });

  it("scatter (per-row focus) gets the signature timing", () => {
    const option = applyChartAnimationToOption(
      compileScatterOption(
        makeCtx({
          parts: [{ type: "scatter", id: "s", dataKey: "a", points: [{ x: 1, y: 2 }] }],
        } as never),
      ),
    );
    const series = (option.series as Array<Record<string, unknown>>)[0]!;
    expect(series.stateAnimation).toEqual(SIGNATURE);
    expect(series.animationDurationUpdate).toBe(0);
  });

  it("an explicit preset timing wins (per-family fallback path)", () => {
    const series = withFocusTiming({ type: "bar", blur: {}, stateAnimation: { duration: 0 } });
    expect(series.stateAnimation).toEqual({ duration: 0 });
  });

  it("leaves focus-free series untouched", () => {
    const series = { type: "gauge", data: [1] };
    expect(withFocusTiming(series)).toBe(series);
  });
});

describe("legend isolate", () => {
  it("dims to FOCUS.dim — the same level as hover", () => {
    const option: EChartsOption = {
      series: [
        { type: "bar", id: "a", data: [1] },
        { type: "bar", id: "b", data: [2] },
      ],
    };
    const out = withLegendFocus(option, { isClickable: true, selected: "a" });
    const [a, b] = out.series as Array<{ itemStyle?: { opacity?: number } }>;
    expect(a!.itemStyle?.opacity).toBe(1);
    expect(b!.itemStyle?.opacity).toBe(0.2);
  });
});
