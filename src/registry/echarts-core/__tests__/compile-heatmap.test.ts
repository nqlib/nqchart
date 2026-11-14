import { describe, expect, it } from "vitest";
import { compileHeatmapOption } from "../compile-heatmap";
import { makeCtx } from "./make-ctx";
import type { HeatmapPart } from "../parts/types";

function matrix(labels: string[], enableZoom?: boolean): HeatmapPart {
  return {
    type: "heatmap",
    id: "h",
    dataKey: "intensity",
    xLabels: labels,
    yLabels: labels,
    cells: labels.flatMap((row, r) =>
      labels.map((col, c) => ({ row, col, x: c, y: r, value: r === c ? 1 : 0.25 + (r + c) / 100 })),
    ),
    min: 0,
    max: 1,
    ...(enableZoom === undefined ? {} : { enableZoom }),
  };
}

const SIX = ["Search", "Browse", "Cart", "Checkout", "Support", "Returns"];

describe("compileHeatmapOption", () => {
  it("drops the zoom sliders on a small matrix unless asked", () => {
    const small = compileHeatmapOption(makeCtx({ parts: [matrix(SIX)] }));
    expect(small.dataZoom).toBeUndefined();
    const forced = compileHeatmapOption(makeCtx({ parts: [matrix(SIX, true)] }));
    expect(forced.dataZoom).toBeDefined();
    const big = Array.from({ length: 13 }, (_, i) => `c${i}`);
    expect(compileHeatmapOption(makeCtx({ parts: [matrix(big)] })).dataZoom).toBeDefined();
  });

  it("labels every column and tilts long names", () => {
    const option = compileHeatmapOption(makeCtx({ parts: [matrix(SIX)] }));
    const label = (option.xAxis as { axisLabel?: { interval?: number; rotate?: number } }).axisLabel;
    expect(label?.interval).toBe(0);
    expect(label?.rotate).toBeGreaterThan(0);
    const short = compileHeatmapOption(makeCtx({ parts: [matrix(["A", "B", "C"])] }));
    expect((short.xAxis as { axisLabel?: { rotate?: number } }).axisLabel?.rotate).toBeUndefined();
  });

  it("shows two decimals on a 0–1 scale and names both axes in the tooltip", () => {
    const option = compileHeatmapOption(
      makeCtx({ config: { intensity: { label: "Correlation" } }, parts: [matrix(SIX)] }),
    );
    const visualMap = [option.visualMap].flat()[0] as { precision?: number };
    expect(visualMap.precision).toBe(2);
    const formatter = (option.tooltip as { formatter?: (p: unknown) => string }).formatter!;
    const html = formatter({ value: [3, 1, 0.34] });
    expect(html).toContain("Browse × Checkout");
    expect(html).toContain("Correlation");
    expect(html).toContain("0.34");
  });
});
