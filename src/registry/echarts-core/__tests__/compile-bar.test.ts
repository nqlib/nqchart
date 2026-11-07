import { describe, expect, it } from "vitest";
import { compileBarOption } from "../compile-bar";
import type { BarSeriesPart } from "../parts/types";
import { resolveChartSignature } from "../chart-signature";
import { makeCtx } from "./make-ctx";

const revenueBar: BarSeriesPart = {
  type: "bar",
  id: "bar-revenue",
  dataKey: "revenue",
};

describe("compileBarOption", () => {
  it("leaves room above a monospace bar so the top label is not clipped", () => {
    const option = compileBarOption(
      makeCtx({
        parts: [{ ...revenueBar, variant: "monospace" }],
        xDataKey: "month",
        data: [
          { month: "Jan", revenue: 100 },
          { month: "Aug", revenue: 950 },
        ],
      }),
    );

    const grid = option.grid as { top?: number };
    const series = option.series as Array<{ type?: string; clip?: boolean }>;
    expect(grid.top).toBeGreaterThanOrEqual(28);
    expect(series[0]?.type).toBe("custom");
    expect(series[0]?.clip).toBe(false);
  });

  it("builds vertical unstacked bars", () => {
    const option = compileBarOption(
      makeCtx({
        parts: [revenueBar],
        xDataKey: "month",
        data: [
          { month: "Jan", revenue: 100 },
          { month: "Feb", revenue: 200 },
        ],
      }),
    );

    const series = option.series as Array<{ type: string; data: unknown[] }>;
    expect(series[0]?.type).toBe("bar");
    expect(series[0]?.data).toHaveLength(2);
  });

  it("builds horizontal layout when layout is horizontal", () => {
    const option = compileBarOption(
      makeCtx({
        parts: [revenueBar],
        cartesian: { layout: "horizontal" },
        xDataKey: "month",
        data: [{ month: "Jan", revenue: 50 }],
      }),
    );

    const xAxis = option.xAxis as { type: string };
    const yAxis = option.yAxis as {
      type: string;
      axisLabel?: { interval?: number; hideOverlap?: boolean };
    };
    expect(xAxis.type).toBe("value");
    expect(yAxis.type).toBe("category");
    expect(yAxis.axisLabel?.interval).toBe(0);
    expect(yAxis.axisLabel?.hideOverlap).toBe(true);
  });

  it("enables category label collision hiding for histograms", () => {
    const option = compileBarOption(
      makeCtx({
        parts: [{ type: "bar", id: "count", dataKey: "count" }],
        cartesian: { variant: "histogram" },
        xDataKey: "bin",
        data: [
          { bin: "0–10", count: 2 },
          { bin: "10–20", count: 4 },
        ],
      }),
    );

    const xAxis = option.xAxis as {
      axisLabel?: { interval?: number; hideOverlap?: boolean; overflow?: string };
    };
    expect(xAxis.axisLabel?.interval).toBe(0);
    expect(xAxis.axisLabel?.hideOverlap).toBe(true);
    expect(xAxis.axisLabel?.overflow).toBe("truncate");
  });

  it("renders a missing dataKey as a gap, not a zero", () => {
    const option = compileBarOption(
      makeCtx({
        parts: [{ ...revenueBar, dataKey: "revenueee" }],
        xDataKey: "month",
        data: [{ month: "Jan", revenue: 99 }],
      }),
    );

    // A typo'd dataKey used to compile to 0, which draws a bar sitting on the
    // axis — indistinguishable from a real zero and from a month where nothing
    // was spent. `null` paints no bar at all, so the absence is visible.
    const series = option.series as Array<{ data: Array<{ value: number | null }> }>;
    expect(series[0]?.data[0]?.value).toBeNull();
  });

  it("renders an explicit null datum as a gap", () => {
    const option = compileBarOption(
      makeCtx({
        parts: [revenueBar],
        xDataKey: "month",
        data: [
          { month: "Jan", revenue: 120 },
          { month: "Feb", revenue: null },
          { month: "Mar", revenue: 0 },
        ],
      }),
    );

    const series = option.series as Array<{ data: Array<{ value: number | null }> }>;
    // A real zero must survive as a zero — only the absent value becomes a gap.
    expect(series[0]?.data.map((d) => d.value)).toEqual([120, null, 0]);
  });

  it("normalizes stacked percent values to 0–100", () => {
    const option = compileBarOption(
      makeCtx({
        parts: [
          { type: "bar", id: "a", dataKey: "a", stackId: "s" },
          { type: "bar", id: "b", dataKey: "b", stackId: "s" },
        ],
        cartesian: { stackType: "percent" },
        xDataKey: "month",
        data: [{ month: "Jan", a: 186, b: 80 }],
      }),
    );

    const yAxis = option.yAxis as { max?: number };
    expect(yAxis.max).toBe(100);

    const series = option.series as Array<{ data: Array<{ value: number }> }>;
    // 186+80=266 → ~69.92 / ~30.08
    expect(series[0]?.data[0]?.value).toBeCloseTo((186 / 266) * 100, 5);
    expect(series[1]?.data[0]?.value).toBeCloseTo((80 / 266) * 100, 5);
    expect((series[0]?.data[0]?.value ?? 0) + (series[1]?.data[0]?.value ?? 0)).toBeCloseTo(
      100,
      5,
    );
  });

  it("rounds a negative bar at the outer end", () => {
    const option = compileBarOption(
      makeCtx({
        parts: [revenueBar],
        cartesian: { barRadius: 4 },
        xDataKey: "x",
        data: [
          { x: "Jan", revenue: 12000 },
          { x: "Feb", revenue: -8000 },
          { x: "Mar", revenue: 0 },
        ],
      }),
    );

    const series = option.series as Array<{
      data: Array<{ itemStyle: { borderRadius: number[] } }>;
    }>;
    expect(series[0]?.data.map((d) => d.itemStyle.borderRadius)).toEqual([
      [4, 4, 0, 0],
      [0, 0, 4, 4],
      [0, 0, 0, 0],
    ]);
  });

  it("rounds a horizontal negative bar on the left", () => {
    const option = compileBarOption(
      makeCtx({
        parts: [revenueBar],
        cartesian: { layout: "horizontal", barRadius: 4 },
        xDataKey: "x",
        data: [
          { x: "Jan", revenue: 5 },
          { x: "Feb", revenue: -5 },
        ],
      }),
    );

    const series = option.series as Array<{
      data: Array<{ itemStyle: { borderRadius: number[] } }>;
    }>;
    expect(series[0]?.data.map((d) => d.itemStyle.borderRadius)).toEqual([
      [0, 4, 4, 0],
      [4, 0, 0, 4],
    ]);
  });

  it("rounds only the outer end of each same-sign stack: seams flat, zero line square", () => {
    const option = compileBarOption(
      makeCtx({
        parts: [
          { type: "bar", id: "gain", dataKey: "gain", stackId: "s" },
          { type: "bar", id: "more", dataKey: "more", stackId: "s" },
          { type: "bar", id: "loss", dataKey: "loss", stackId: "s" },
          { type: "bar", id: "deeper", dataKey: "deeper", stackId: "s" },
        ],
        cartesian: { barRadius: 4 },
        xDataKey: "x",
        data: [{ x: "Jan", gain: 20000, more: 1000, loss: -7000, deeper: -500 }],
      }),
    );

    const series = option.series as Array<{
      data: Array<{ itemStyle: { borderRadius: number[] } }>;
    }>;
    // gain: on zero, flat seam above → square. more: rounded outer top only.
    // Mirrored for the negative stack.
    expect(series.map((s) => s.data[0]?.itemStyle.borderRadius)).toEqual([
      [0, 0, 0, 0],
      [4, 4, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 4, 4],
    ]);
  });

  it("paints a seam shadow toward zero on segments that are not on the zero line", () => {
    const option = compileBarOption(
      makeCtx({
        parts: [
          { type: "bar", id: "a", dataKey: "a", stackId: "s" },
          { type: "bar", id: "b", dataKey: "b", stackId: "s" },
          { type: "bar", id: "c", dataKey: "c", stackId: "s" },
        ],
        xDataKey: "x",
        data: [{ x: "Jan", a: 5, b: 3, c: -2 }],
      }),
    );
    const series = option.series as Array<{
      data: Array<{ itemStyle: { shadowOffsetY?: number; shadowBlur?: number; borderWidth?: number } }>;
    }>;
    const seam = resolveChartSignature("test-chart").gap.seam;
    expect(series[0]?.data[0]?.itemStyle.shadowOffsetY).toBeUndefined();
    expect(series[1]?.data[0]?.itemStyle.shadowOffsetY).toBe(seam);
    expect(series[1]?.data[0]?.itemStyle.shadowBlur).toBe(0);
    // A lone negative segment is on the zero line: no seam.
    expect(series[2]?.data[0]?.itemStyle.shadowOffsetY).toBeUndefined();
    // A border would shrink the bar on every edge.
    expect(series[1]?.data[0]?.itemStyle.borderWidth).toBeUndefined();
  });

  it("uses the signature gaps for grouped and stacked bars, and none for a histogram", () => {
    const sig = resolveChartSignature("test-chart").bar;
    const parts = [{ type: "bar" as const, id: "a", dataKey: "a" }];
    const data = [{ x: "Jan", a: 1 }];
    type Layout = { barCategoryGap?: unknown; barGap?: unknown; barWidth?: unknown };
    const layout = (cartesian?: Record<string, unknown>) =>
      (compileBarOption(makeCtx({ parts, data, xDataKey: "x", cartesian })).series as Layout[])[0]!;
    for (const l of [layout(), layout({ stackType: "stacked" })]) {
      expect(l.barCategoryGap).toBe(sig.categoryGap);
      expect(l.barGap).toBe(sig.groupGap);
      expect(l.barWidth).toBeUndefined();
    }
    expect(layout({ variant: "histogram" })).toMatchObject({
      barCategoryGap: 0,
      barGap: 0,
      barWidth: "100%",
    });
  });
});


describe("bar value labels follow the bar's outer end", () => {
  it("puts negative labels below (vertical) / left (horizontal)", async () => {
    const { barLabelPosition } = await import("../series-labels");
    expect(barLabelPosition(5, false)).toBe("top");
    expect(barLabelPosition(-5, false)).toBe("bottom");
    expect(barLabelPosition(5, true)).toBe("right");
    expect(barLabelPosition(-5, true)).toBe("left");
    expect(barLabelPosition(null, false)).toBe("top");
  });
});

describe("series value labels skip missing points", () => {
  it("returns an empty label for null so stacked neighbours don't print 0", async () => {
    const { seriesLabelOption } = await import("../series-labels");
    const opt = seriesLabelOption(true, (v) => `${Number(v)}`) as { formatter: (p: { value?: unknown }) => string };
    expect(opt.formatter({ value: null })).toBe("");
    expect(opt.formatter({ value: "-" })).toBe("");
    expect(opt.formatter({ value: 8 })).toBe("8");
  });
});
