import { describe, expect, it } from "vitest";
import { compileComposedOption } from "@/registry/echarts-core/compile-composed";
import { compilePieOption } from "@/registry/echarts-core/compile-pie";
import { withHeadlessTheme } from "@/registry/echarts-core/headless-theme";
import { printLegend } from "../print-legend";
import { renderToSvg } from "../render-to-svg";
import { composedPrintCtx, donutPrintCtx, LEGEND, PRINT_THEME } from "./print-fixture";

describe("renderToSvg", () => {
  it("draws a composed chart with a dashed line and a legend", () => {
    const ctx = composedPrintCtx();
    const option = withHeadlessTheme(ctx.chartId, PRINT_THEME, () =>
      printLegend(ctx, LEGEND, compileComposedOption(ctx)),
    );
    const svg = renderToSvg(option, { width: 640, height: 300 });

    expect(svg.startsWith("<svg")).toBe(true);
    expect(svg).toContain('width="640"');
    expect(svg).toContain("stroke-dasharray");
    // The axis labels take the theme's muted colour, the legend labels its foreground.
    expect(svg.toLowerCase()).toContain(PRINT_THEME.chrome.muted);
    expect(svg.toLowerCase()).toContain(PRINT_THEME.chrome.foreground);
    // The series line is dashed (not only the split lines).
    expect(svg).toMatch(/stroke="#1d4ed8"[^>]*stroke-dasharray/);
    expect(svg).toContain("Actual hours");
    expect(svg).toContain("Planned hours");
    // The line colour came through the theme token.
    expect(svg.toLowerCase()).toContain("#1d4ed8");
    expect(svg.toLowerCase()).toContain("#f97316");
  });

  it("draws a donut with its slice colours", () => {
    const ctx = donutPrintCtx();
    const option = withHeadlessTheme(ctx.chartId, PRINT_THEME, () =>
      printLegend(ctx, LEGEND, compilePieOption(ctx)),
    );
    const svg = renderToSvg(option, { width: 400, height: 300 });

    expect(svg.startsWith("<svg")).toBe(true);
    for (const color of ["#0ea5e9", "#22c55e", "#ef4444"]) {
      expect(svg.toLowerCase()).toContain(color);
    }
    expect(svg).toContain("Closed");
  });
});
