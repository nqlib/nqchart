import { describe, expect, it } from "vitest";
import { compileComposedOption } from "../compile-composed";
import type { AreaSeriesPart, LineSeriesPart } from "../parts/types";
import { makeCtx } from "./make-ctx";

const otdLine: LineSeriesPart = {
  type: "line",
  id: "line-otd",
  dataKey: "otd",
};

const otdArea: AreaSeriesPart = {
  type: "area",
  id: "area-otd",
  dataKey: "otd",
};

describe("compileComposedOption", () => {
  it("gives unique series ids when Area and Line share a dataKey", () => {
    const option = compileComposedOption(
      makeCtx({
        parts: [otdArea, otdLine],
        config: { otd: { label: "On-time delivery" } },
        xDataKey: "month",
        data: [
          { month: "Jan", otd: 0.9 },
          { month: "Feb", otd: 0.92 },
        ],
      }),
    );

    const series = option.series as Array<{ id: string; type: string; areaStyle?: unknown }>;
    const ids = series.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toContain("otd");
    expect(ids).toContain("otd__nq_area");
  });

  it("sets lineStyle.type dashed when Line variant is dashed", () => {
    const option = compileComposedOption(
      makeCtx({
        parts: [{ ...otdLine, variant: "dashed" }],
        xDataKey: "month",
        data: [{ month: "Jan", otd: 0.9 }],
      }),
    );

    const series = option.series as Array<{ type?: string; lineStyle?: { type?: string } }>;
    const line = series.find((s) => s.type === "line");
    expect(line?.lineStyle?.type).toBe("dashed");
  });
});
