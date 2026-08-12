import { describe, expect, it } from "vitest";
import { compileAreaOption } from "../compile-area";
import type { AreaSeriesPart } from "../parts/types";
import { makeCtx } from "./make-ctx";

const desktop: AreaSeriesPart = {
  type: "area",
  id: "area-desktop",
  dataKey: "desktop",
};

const mobile: AreaSeriesPart = {
  type: "area",
  id: "area-mobile",
  dataKey: "mobile",
};

describe("compileAreaOption", () => {
  it("normalizes stacked percent values to 0–100", () => {
    const option = compileAreaOption(
      makeCtx({
        parts: [desktop, mobile],
        cartesian: { stackType: "percent" },
        xDataKey: "month",
        data: [
          { month: "Jan", desktop: 186, mobile: 80 },
          { month: "Feb", desktop: 305, mobile: 200 },
        ],
      }),
    );

    const yAxis = Array.isArray(option.yAxis) ? option.yAxis[0] : option.yAxis;
    expect((yAxis as { max?: number }).max).toBe(100);

    const series = option.series as Array<{ stack?: string; data: number[] }>;
    expect(series[0]?.stack).toBe("nq-area");
    expect(series[1]?.stack).toBe("nq-area");

    // Jan: 186+80=266 → ~69.92 / ~30.08
    expect(series[0]?.data[0]).toBeCloseTo((186 / 266) * 100, 5);
    expect(series[1]?.data[0]).toBeCloseTo((80 / 266) * 100, 5);
    expect((series[0]?.data[0] ?? 0) + (series[1]?.data[0] ?? 0)).toBeCloseTo(100, 5);

    // Feb: 305+200=505 → ~60.40 / ~39.60
    expect(series[0]?.data[1]).toBeCloseTo((305 / 505) * 100, 5);
    expect(series[1]?.data[1]).toBeCloseTo((200 / 505) * 100, 5);
  });

  it("leaves raw values when stackType is stacked", () => {
    const option = compileAreaOption(
      makeCtx({
        parts: [desktop, mobile],
        cartesian: { stackType: "stacked" },
        xDataKey: "month",
        data: [{ month: "Jan", desktop: 186, mobile: 80 }],
      }),
    );

    const series = option.series as Array<{ data: number[] }>;
    expect(series[0]?.data[0]).toBe(186);
    expect(series[1]?.data[0]).toBe(80);
  });
});
