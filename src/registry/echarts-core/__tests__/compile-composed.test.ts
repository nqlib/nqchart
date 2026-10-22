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

  it("rounds a plain negative bar at the bottom", () => {
    const option = compileComposedOption(
      makeCtx({
        parts: [{ type: "bar", id: "a", dataKey: "a" }],
        cartesian: { barRadius: 4 },
        xDataKey: "x",
        config: { a: { label: "Net" } },
        data: [
          { x: "Jan", a: 12000 },
          { x: "Feb", a: -8000 },
        ],
      }),
    );

    const series = option.series as Array<{
      itemStyle?: { borderRadius?: number[] };
      data: Array<{ itemStyle: { borderRadius: number[] } }>;
    }>;
    expect(series[0]?.itemStyle?.borderRadius).toBeUndefined();
    expect(series[0]?.data.map((d) => d.itemStyle.borderRadius)).toEqual([
      [4, 4, 0, 0],
      [0, 0, 4, 4],
    ]);
  });

  it("rounds stacked gain and loss on their outer ends", () => {
    const option = compileComposedOption(
      makeCtx({
        parts: [
          { type: "bar", id: "gain", dataKey: "gain", stackId: "s" },
          { type: "bar", id: "loss", dataKey: "loss", stackId: "s" },
        ],
        cartesian: { barRadius: 4 },
        xDataKey: "x",
        config: { gain: { label: "Gain" }, loss: { label: "Loss" } },
        data: [{ x: "Jan", gain: 20000, loss: -7000 }],
      }),
    );

    const series = option.series as Array<{
      data: Array<{ itemStyle: { borderRadius: number[] } }>;
    }>;
    expect(series.map((s) => s.data[0]?.itemStyle.borderRadius)).toEqual([
      [4, 4, 0, 0],
      [0, 0, 4, 4],
    ]);
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

  it("rounds only the outer end of a positive stack", () => {
    expect(radii("a").slice(0, 2)).toEqual([
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ]);
    expect(radii("b").slice(0, 2)).toEqual([
      [4, 4, 0, 0],
      [4, 4, 0, 0],
    ]);
  });

  it("hands the outer role to the other series when the top series is null", () => {
    expect(radii("a")[2]).toEqual([4, 4, 0, 0]);
    expect((bar("b").data as BarPoint[])[2]?.value).toBeNull();
  });

  it("keeps per-point values and no series radius on a stacked bar", () => {
    expect((bar("a").data as BarPoint[]).map((p) => p.value)).toEqual([3, 4, 6]);
    expect(bar("a").itemStyle?.borderRadius).toBeUndefined();
  });

  it("gives an unstacked bar a per-point radius and keeps the value", () => {
    const c = bar("c");
    expect(c.itemStyle?.borderRadius).toBeUndefined();
    expect((c.data as BarPoint[]).map((p) => p.value)).toEqual([1, 2, 3]);
    expect((c.data as BarPoint[]).map((p) => p.itemStyle?.borderRadius)).toEqual([
      [4, 4, 0, 0],
      [4, 4, 0, 0],
      [4, 4, 0, 0],
    ]);
  });
});
