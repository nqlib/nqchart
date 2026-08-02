import { describe, expect, it } from "vitest";
import { compileBarOption } from "../compile-bar";
import type { BarSeriesPart } from "../parts/types";
import { makeCtx } from "./make-ctx";

const revenueBar: BarSeriesPart = {
  type: "bar",
  id: "bar-revenue",
  dataKey: "revenue",
};

describe("compileBarOption", () => {
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

  it("coerces missing dataKey values to 0", () => {
    const option = compileBarOption(
      makeCtx({
        parts: [{ ...revenueBar, dataKey: "revenueee" }],
        xDataKey: "month",
        data: [{ month: "Jan", revenue: 99 }],
      }),
    );

    const series = option.series as Array<{ data: Array<{ value: number }> }>;
    // KNOWN-ISSUE: typo dataKey silently renders zeros instead of warning.
    expect(series[0]?.data[0]?.value).toBe(0);
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
});

