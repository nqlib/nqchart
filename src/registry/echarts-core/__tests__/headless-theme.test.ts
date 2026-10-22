import { describe, expect, it } from "vitest";
import { compileComposedOption } from "../compile-composed";
import { compilePieOption } from "../compile-pie";
import { headlessThemeOf, resolveTokenColor, withHeadlessTheme, type HeadlessTheme } from "../headless-theme";
import type { ChartPart } from "../parts/types";
import { createColorResolver } from "../resolve-chart-colors";
import { makeCtx } from "./make-ctx";

const THEME: HeadlessTheme = {
  isDark: false,
  chrome: {
    foreground: "#112233",
    background: "#fefefe",
    muted: "#445566",
    border: "#ddeeff",
    splitLine: "#ccddee",
    popover: "#ffffff",
    popoverForeground: "#112233",
  },
  tones: {
    neutral: "#777777",
    accent: "#0055aa",
    positive: "#008800",
    warning: "#cc8800",
    critical: "#cc0000",
  },
  tokens: { "--metric-plan": "var(--blue-700)", "--blue-700": "#1d4ed8" },
  radiusPx: 10,
  fontFamily: "Inter, sans-serif",
  animation: false,
};

const CHART_ID = "headless-test";
const config = {
  plan: { label: "Plan", colors: { light: ["var(--metric-plan)"], dark: ["var(--metric-plan)"] } },
  actual: { label: "Actual", colors: { light: ["#ff8800"] } },
};
const parts: ChartPart[] = [
  { type: "grid", id: "g" },
  { type: "xAxis", id: "x", dataKey: "month" },
  { type: "yAxis", id: "y" },
  { type: "bar", id: "b", dataKey: "actual" },
  { type: "line", id: "l", dataKey: "plan", variant: "dashed" },
  { type: "referenceLine", id: "r", y: 5, label: "Target", tone: "accent" },
];
const data = [
  { month: "Jan", actual: 4, plan: 5 },
  { month: "Feb", actual: 6, plan: 5 },
  { month: "Mar", actual: 7, plan: 6 },
];

function composedCtx() {
  return makeCtx({
    chartId: CHART_ID,
    config,
    data,
    parts,
    xDataKey: "month",
    resolveColor: createColorResolver(CHART_ID, config),
  });
}

type SeriesLike = Record<string, unknown> & {
  type?: string;
  id?: string;
  lineStyle?: { color?: string; type?: string };
  itemStyle?: { color?: unknown; borderRadius?: unknown };
  markLine?: { data?: Array<{ lineStyle?: { color?: string } }> };
  animationDuration?: unknown;
};

describe("headless theme registry", () => {
  it("registers a theme only while the callback runs", () => {
    expect(headlessThemeOf(CHART_ID)).toBeUndefined();
    withHeadlessTheme(CHART_ID, THEME, () => {
      expect(headlessThemeOf(CHART_ID)).toBe(THEME);
    });
    expect(headlessThemeOf(CHART_ID)).toBeUndefined();
  });

  it("resolves a var() chain through the tokens, with a fallback", () => {
    expect(resolveTokenColor("var(--metric-plan)", THEME.tokens)).toBe("#1d4ed8");
    expect(resolveTokenColor("var(--unknown, #abcdef)", THEME.tokens)).toBe("#abcdef");
    expect(resolveTokenColor("var(--unknown)", THEME.tokens)).toBe("var(--unknown)");
    expect(resolveTokenColor("#123456", undefined)).toBe("#123456");
  });

  it("compiles a composed chart with the theme's font, chrome, tones, radius and colours", () => {
    const option = withHeadlessTheme(CHART_ID, THEME, () => compileComposedOption(composedCtx()));

    const textStyle = option.textStyle as { color?: string; fontFamily?: string };
    expect(textStyle.fontFamily).toBe("Inter, sans-serif");
    expect(textStyle.color).toBe("#112233");

    const yAxis = (Array.isArray(option.yAxis) ? option.yAxis[0] : option.yAxis) as {
      splitLine?: { lineStyle?: { color?: string } };
      axisLabel?: { color?: string };
    };
    expect(yAxis.splitLine?.lineStyle?.color).toBe("#ccddee");
    expect(yAxis.axisLabel?.color).toBe("#445566");

    expect(option.animation).toBe(false);
    const series = option.series as SeriesLike[];
    for (const s of series) expect(s.animationDuration).toBeUndefined();

    const line = series.find((s) => s.type === "line" && s.id === "plan");
    expect(line?.lineStyle?.color).toBe("#1d4ed8");
    expect(line?.lineStyle?.type).toBe("dashed");

    const bar = series.find((s) => s.type === "bar");
    expect(bar?.itemStyle?.color).toBe("#ff8800");
    // --radius 10px → --radius-sm = 10 - 4 = 6px on the top corners.
    expect(bar?.itemStyle?.borderRadius).toEqual([6, 6, 0, 0]);

    const reference = series.find((s) => Array.isArray(s.markLine?.data));
    expect(reference?.markLine?.data?.[0]?.lineStyle?.color).toBe("#0055aa");
  });

  it("leaves the option without a theme as it was (no theme colours, animation on)", () => {
    const option = compileComposedOption(composedCtx());
    const textStyle = option.textStyle as { color?: string; fontFamily?: string };
    expect(textStyle.color).not.toBe("#112233");
    expect(option.animation).not.toBe(false);
    const line = (option.series as SeriesLike[]).find((s) => s.type === "line" && s.id === "plan");
    // No DOM and no theme: the config colour stays literal, as in 0.3.2.
    expect(line?.lineStyle?.color).toBe("var(--metric-plan)");
  });

  it("uses the dark slot and the dark tile label in a dark theme", () => {
    const dark: HeadlessTheme = { ...THEME, isDark: true };
    const pieConfig = {
      a: { label: "A", colors: { light: ["#111111"], dark: ["#eeeeee"] } },
      b: { label: "B", colors: { light: ["#222222"], dark: ["#dddddd"] } },
    };
    const option = withHeadlessTheme("pie-dark", dark, () =>
      compilePieOption(
        makeCtx({
          chartId: "pie-dark",
          config: pieConfig,
          data: [
            { name: "a", value: 1 },
            { name: "b", value: 2 },
          ],
          parts: [{ type: "pie", id: "p", dataKey: "value", nameKey: "name", innerRadius: "55%" }],
          nameKey: "name",
          valueKey: "value",
          resolveColor: createColorResolver("pie-dark", pieConfig),
        }),
      ),
    );
    const pie = (option.series as Array<{ data?: Array<{ itemStyle?: { color?: string } }> }>)[0];
    expect(pie?.data?.map((d) => d.itemStyle?.color)).toEqual(["#eeeeee", "#dddddd"]);
  });
});
