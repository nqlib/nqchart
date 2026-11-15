import type { EChartsOption } from "echarts";
import { BarChart, LineChart, ScatterChart } from "echarts/charts";
import { GridComponent } from "echarts/components";
import * as echarts from "echarts/core";
import { SVGRenderer } from "echarts/renderers";
import { describe, expect, it } from "vitest";
import { timeValue } from "../cartesian-series";
import { compileAreaOption } from "../compile-area";
import { compileBarOption } from "../compile-bar";
import { compileComposedOption } from "../compile-composed";
import { compileLineOption } from "../compile-line";
import { compileScatterOption } from "../compile-scatter";
import type { ChartPart } from "../parts/types";
import { makeCtx } from "./make-ctx";

echarts.use([SVGRenderer, GridComponent, BarChart, LineChart, ScatterChart]);

type AxisModel = { axis: { scale: { getExtent(): [number, number] } } };

/** Lay the option out with ECharts SSR and read an axis's real extent. */
function extentOf(option: EChartsOption, axis: "xAxis" | "yAxis", index = 0): [number, number] {
  const chart = echarts.init(null, undefined, { renderer: "svg", ssr: true, width: 400, height: 300 });
  try {
    const { tooltip: _tooltip, dataZoom: _zoom, ...rest } = option;
    void _tooltip;
    void _zoom;
    chart.setOption({ ...rest, animation: false });
    const model = (chart as unknown as { getModel(): { getComponent(t: string, i: number): AxisModel } })
      .getModel()
      .getComponent(axis, index);
    return model.axis.scale.getExtent();
  } finally {
    chart.dispose();
  }
}

function first<T>(value: T | T[] | undefined): T {
  return (Array.isArray(value) ? value[0] : value) as T;
}

type SeriesLike = { id?: string; stack?: string; data?: unknown[] };
const seriesOf = (option: EChartsOption) => option.series as SeriesLike[];
const valuesOf = (s: SeriesLike) => (s.data ?? []).map((d) => (d && typeof d === "object" && "value" in d ? (d as { value: unknown }).value : d));

const xAxis = (extra: Partial<Extract<ChartPart, { type: "xAxis" }>> = {}): ChartPart => ({
  type: "xAxis",
  id: "x",
  dataKey: "d",
  ...extra,
});
const yAxis = (extra: Partial<Extract<ChartPart, { type: "yAxis" }>> = {}): ChartPart => ({
  type: "yAxis",
  id: "y",
  ...extra,
});

describe("timeValue", () => {
  it("reads a date-only string as local midnight", () => {
    expect(timeValue("2026-03-01")).toBe(new Date(2026, 2, 1).getTime());
  });

  it("reads a Date, epoch ms, and an ISO string; rejects junk", () => {
    const at = new Date(2026, 0, 15, 9, 30);
    expect(timeValue(at)).toBe(at.getTime());
    expect(timeValue(at.getTime())).toBe(at.getTime());
    expect(timeValue("2026-01-15T09:30:00Z")).toBe(Date.UTC(2026, 0, 15, 9, 30));
    expect(timeValue("not a date")).toBeNull();
    expect(timeValue("")).toBeNull();
    expect(timeValue(null)).toBeNull();
  });
});

describe("time x axis", () => {
  const data = [
    { d: "2026-01-01", v: 1 },
    { d: "2026-03-01", v: 2 },
    { d: "2026-06-01", v: 3 },
  ];

  it("line: places points by date, not at 1970", () => {
    const option = compileLineOption(
      makeCtx({ data, xDataKey: "d", parts: [xAxis({ scale: "time" }), { type: "line", id: "l", dataKey: "v" }] }),
    );
    const x = first(option.xAxis) as { type: string; data?: unknown };
    expect(x.type).toBe("time");
    expect(x.data).toBeUndefined();
    expect(valuesOf(seriesOf(option)[0]!)).toEqual([
      [new Date(2026, 0, 1).getTime(), 1],
      [new Date(2026, 2, 1).getTime(), 2],
      [new Date(2026, 5, 1).getTime(), 3],
    ]);
    const [min, max] = extentOf(option, "xAxis");
    expect(new Date(min).getFullYear()).toBe(2026);
    expect(new Date(max).getFullYear()).toBe(2026);
  });

  it("line: keeps the row's own x text as the point name, and a bad date as a gap in place", () => {
    const option = compileLineOption(
      makeCtx({
        data: [...data.slice(0, 2), { d: "soon", v: 9 }, data[2]!],
        xDataKey: "d",
        parts: [xAxis({ scale: "time" }), { type: "line", id: "l", dataKey: "v" }],
      }),
    );
    const points = seriesOf(option)[0]!.data as Array<{ name: string } | null>;
    expect(points).toHaveLength(4);
    expect(points[0]!.name).toBe("2026-01-01");
    expect(points[2]).toBeNull();
    expect(new Date(extentOf(option, "xAxis")[0]).getFullYear()).toBe(2026);
  });

  it("area: time x axis, and the category brush turns off", () => {
    const option = compileAreaOption(
      makeCtx({
        data,
        xDataKey: "d",
        parts: [xAxis({ scale: "time" }), { type: "area", id: "a", dataKey: "v" }, { type: "brush", id: "b" } as ChartPart],
      }),
    );
    expect((first(option.xAxis) as { type: string }).type).toBe("time");
    expect(option.dataZoom).toBeUndefined();
  });

  it("bar and composed keep a category x axis", () => {
    const parts: ChartPart[] = [xAxis({ scale: "time" }), { type: "bar", id: "b", dataKey: "v" }];
    for (const option of [
      compileBarOption(makeCtx({ data, xDataKey: "d", parts })),
      compileComposedOption(makeCtx({ data, xDataKey: "d", parts })),
    ]) {
      const x = first(option.xAxis) as { type: string; data?: unknown[] };
      expect(x.type).toBe("category");
      expect(x.data).toEqual(["2026-01-01", "2026-03-01", "2026-06-01"]);
    }
  });

  it("the axis tooltip shows the value, not the epoch time", () => {
    const option = compileLineOption(
      makeCtx({
        data,
        xDataKey: "d",
        config: { v: { label: "Visits" } },
        parts: [xAxis({ scale: "time" }), { type: "line", id: "l", dataKey: "v" }, { type: "tooltip", id: "t" } as ChartPart],
      }),
    );
    const formatter = (option.tooltip as { formatter: (p: unknown) => string }).formatter;
    const t = new Date(2026, 2, 1).getTime();
    const html = formatter([
      { seriesName: "Visits", seriesId: "v", name: "2026-03-01", value: [t, 2], axisType: "xAxis.time" },
    ]);
    expect(html).toContain("2026-03-01");
    expect(html).toContain(">2<");
    expect(html).not.toContain(t.toLocaleString());
  });
});

describe("log value axis", () => {
  const data = [
    { m: "a", v: 0, w: 5 },
    { m: "b", v: 10, w: 5 },
    { m: "c", v: 1000, w: 5 },
  ];
  const bars: ChartPart[] = [
    xAxis({ dataKey: "m" }),
    yAxis({ scale: "log" }),
    { type: "bar", id: "b1", dataKey: "v" },
    { type: "bar", id: "b2", dataKey: "w" },
  ];

  it("bar: a zero is a gap and does not collapse the extent", () => {
    const option = compileBarOption(makeCtx({ data, xDataKey: "m", parts: bars }));
    expect(valuesOf(seriesOf(option)[0]!)).toEqual([null, 10, 1000]);
    expect(extentOf(option, "yAxis")[1]).toBeGreaterThanOrEqual(1000);
  });

  it("bar: a stacked or percent chart draws its bars side by side", () => {
    for (const stackType of ["stacked", "percent"] as const) {
      const option = compileBarOption(makeCtx({ data, xDataKey: "m", parts: bars, cartesian: { stackType } }));
      expect(seriesOf(option).every((s) => s.stack == null)).toBe(true);
      expect((first(option.yAxis) as { max?: number }).max).toBeUndefined();
      expect(valuesOf(seriesOf(option)[1]!)).toEqual([5, 5, 5]);
    }
  });

  it("bar: a stackId on a log axis is ignored; a linear right axis keeps its stack", () => {
    const option = compileBarOption(
      makeCtx({
        data,
        xDataKey: "m",
        parts: [
          xAxis({ dataKey: "m" }),
          yAxis({ scale: "log", yAxisId: "left" }),
          yAxis({ id: "y2", yAxisId: "right", orientation: "right" }),
          { type: "bar", id: "b1", dataKey: "v", stackId: "s", yAxisId: "left" },
          { type: "bar", id: "b2", dataKey: "w", stackId: "t", yAxisId: "right" },
        ],
      }),
    );
    expect(seriesOf(option).map((s) => s.stack)).toEqual([undefined, "t"]);
  });

  it("line, area, and composed: a zero is a gap; area layers do not stack", () => {
    const line = compileLineOption(
      makeCtx({ data, xDataKey: "m", parts: [xAxis({ dataKey: "m" }), yAxis({ scale: "log" }), { type: "line", id: "l", dataKey: "v" }] }),
    );
    expect(valuesOf(seriesOf(line)[0]!)).toEqual([null, 10, 1000]);
    expect(extentOf(line, "yAxis")[1]).toBeGreaterThanOrEqual(1000);

    const area = compileAreaOption(
      makeCtx({
        data,
        xDataKey: "m",
        cartesian: { stackType: "stacked" },
        parts: [xAxis({ dataKey: "m" }), yAxis({ scale: "log" }), { type: "area", id: "a", dataKey: "v" }, { type: "area", id: "a2", dataKey: "w" }],
      }),
    );
    expect(seriesOf(area).every((s) => s.stack == null)).toBe(true);
    expect(valuesOf(seriesOf(area)[0]!)).toEqual([null, 10, 1000]);

    const composed = compileComposedOption(
      makeCtx({
        data,
        xDataKey: "m",
        parts: [
          xAxis({ dataKey: "m" }),
          yAxis({ scale: "log" }),
          { type: "bar", id: "b", dataKey: "v", stackId: "s" },
          { type: "line", id: "l", dataKey: "v" },
        ],
      }),
    );
    const [bar, lineSeries] = seriesOf(composed);
    expect(bar!.stack).toBeUndefined();
    expect(valuesOf(bar!)).toEqual([null, 10, 1000]);
    expect(valuesOf(lineSeries!)).toEqual([null, 10, 1000]);
  });
});

describe("scatter axes", () => {
  const points = [
    { x: 0, y: 4 },
    { x: 10, y: 2 },
    { x: 1000, y: 8 },
  ];
  const scatter = { type: "scatter", id: "s", dataKey: "s", points } as ChartPart;

  it("applies scale, domain, reversed, and unit to both axes", () => {
    const option = compileScatterOption(
      makeCtx({
        parts: [
          xAxis({ dataKey: "x", scale: "log", unit: "ms" }),
          yAxis({ dataKey: "y", domain: [0, 10], reversed: true }),
          scatter,
        ],
      }),
    );
    const x = first(option.xAxis) as { type: string; name?: string };
    const y = first(option.yAxis) as { type: string; min?: number; max?: number; inverse?: boolean };
    expect(x).toMatchObject({ type: "log", name: "ms" });
    expect(y).toMatchObject({ type: "value", min: 0, max: 10, inverse: true });
  });

  it("log axis: drops a point at 0 and spans the rest", () => {
    const option = compileScatterOption(
      makeCtx({ parts: [xAxis({ dataKey: "x", scale: "log" }), yAxis({ dataKey: "y" }), scatter] }),
    );
    expect(valuesOf(seriesOf(option)[0]!)).toEqual([
      [10, 2],
      [1000, 8],
    ]);
    const [min, max] = extentOf(option, "xAxis");
    expect(min).toBeLessThanOrEqual(10);
    expect(max).toBeGreaterThanOrEqual(1000);
  });

  it("time x axis: places points by date with a readable tooltip value", () => {
    const option = compileScatterOption(
      makeCtx({
        parts: [
          xAxis({ dataKey: "d", scale: "time" }),
          yAxis({ dataKey: "y" }),
          {
            type: "scatter",
            id: "s",
            dataKey: "s",
            points: [
              { d: "2026-02-01", y: 3 },
              { d: "2026-05-01", y: 5 },
            ] as unknown as Array<Record<string, number>>,
          } as ChartPart,
        ],
      }),
    );
    expect((first(option.xAxis) as { type: string }).type).toBe("time");
    const data = seriesOf(option)[0]!.data as Array<Record<string, unknown>>;
    expect(data[0]!.__nq_tooltipValue).toBe("2026-02-01 · 3");
    expect(new Date(extentOf(option, "xAxis")[0]).getFullYear()).toBe(2026);
  });
});
