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

describe("compileComposedOption — stacked bar corners", () => {
  type BarPoint = { value: unknown; itemStyle?: { borderRadius?: number[] } };
  type BarSeries = {
    type?: string;
    id?: string;
    data?: Array<BarPoint | unknown>;
    itemStyle?: { borderRadius?: number[] };
  };

  const stackedOption = () =>
    compileComposedOption(
      makeCtx({
        parts: [
          { type: "bar", id: "bar-a", dataKey: "a", stackId: "s", radius: 4 },
          { type: "bar", id: "bar-b", dataKey: "b", stackId: "s", radius: 4 },
          { type: "bar", id: "bar-c", dataKey: "c", radius: 4 },
        ],
        xDataKey: "month",
        data: [
          { month: "Jan", a: 3, b: 2, c: 1 },
          { month: "Feb", a: 4, b: 5, c: 2 },
          // The top series has no value: the other series takes the top role.
          { month: "Mar", a: 6, b: null, c: 3 },
        ],
      }),
    );

  function bar(id: string): BarSeries {
    return (stackedOption().series as BarSeries[]).find((s) => s.id === id)!;
  }

  function radii(id: string): Array<number[] | undefined> {
    return (bar(id).data as BarPoint[]).map((p) => p.itemStyle?.borderRadius);
  }

  it("rounds the bottom segment at the bottom and the top segment at the top", () => {
    expect(radii("a").slice(0, 2)).toEqual([
      [0, 0, 4, 4],
      [0, 0, 4, 4],
    ]);
    expect(radii("b").slice(0, 2)).toEqual([
      [4, 4, 0, 0],
      [4, 4, 0, 0],
    ]);
  });

  it("hands the top role to the other series when the top series is null", () => {
    // The only segment in its column rounds all four corners, the top included.
    expect(radii("a")[2]).toEqual([4, 4, 4, 4]);
    expect((bar("b").data as BarPoint[])[2]?.value).toBeNull();
  });

  it("keeps per-point values and no series radius on a stacked bar", () => {
    expect((bar("a").data as BarPoint[]).map((p) => p.value)).toEqual([3, 4, 6]);
    expect(bar("a").itemStyle?.borderRadius).toBeUndefined();
  });

  it("keeps one series radius and plain values on an unstacked bar", () => {
    const c = bar("c");
    expect(c.itemStyle?.borderRadius).toEqual([4, 4, 0, 0]);
    expect(c.data).toEqual([1, 2, 3]);
  });
});
