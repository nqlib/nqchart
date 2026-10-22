import { LineChart } from "echarts/charts";
import { SVGRenderer } from "echarts/renderers";
import { afterEach, describe, expect, it, vi } from "vitest";
import { compileLineOption } from "../compile-line";
import { getEcharts } from "../echarts-init";
import type { LineSeriesPart, ReferenceBandPart, ReferenceLinePart, YAxisPart } from "../parts/types";
import { makeCtx } from "./make-ctx";

const salesLine: LineSeriesPart = {
  type: "line",
  id: "line-sales",
  dataKey: "sales",
};

const leftAxis: YAxisPart = { type: "yAxis", id: "y-left", yAxisId: "left" };
const rightAxis: YAxisPart = {
  type: "yAxis",
  id: "y-right",
  yAxisId: "right",
  orientation: "right",
};

type Series = {
  id?: string;
  name?: string;
  yAxisIndex?: number;
  data?: Array<number | null>;
  connectNulls?: boolean;
  tooltip?: { show?: boolean };
  areaStyle?: { opacity?: number };
  markLine?: {
    data?: Array<{ yAxis?: number; label?: { position?: string; distance?: [number, number] } }>;
  };
  markArea?: { data?: Array<[{ yAxis?: number | string }, { yAxis?: number | string }]> };
};

type Axis = { min?: unknown; max?: unknown };

function seriesOf(option: ReturnType<typeof compileLineOption>): Series[] {
  return (Array.isArray(option.series) ? option.series : []) as Series[];
}

function refSeries(option: ReturnType<typeof compileLineOption>, axisIndex: number) {
  return seriesOf(option).find((s) => s.id === `test-chart-ref-${axisIndex}`);
}

function yAxes(option: ReturnType<typeof compileLineOption>): Axis[] {
  return (Array.isArray(option.yAxis) ? option.yAxis : [option.yAxis]) as Axis[];
}

const rows = [
  { month: "Jan", sales: 10 },
  { month: "Feb", sales: 20 },
];

describe("reference marks", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("draws a ReferenceLine in a fresh ECharts instance without host registration", () => {
    const echarts = getEcharts([LineChart, SVGRenderer]);
    const option = compileLineOption(
      makeCtx({
        parts: [
          salesLine,
          {
            type: "referenceLine",
            id: "budget",
            y: 40,
            label: "Budget",
          } satisfies ReferenceLinePart,
        ],
        xDataKey: "month",
        data: rows,
      }),
    );

    const chart = echarts.init(null as unknown as HTMLElement, undefined, {
      renderer: "svg",
      ssr: true,
      width: 480,
      height: 320,
    });
    try {
      chart.setOption(option);
      const model = (
        chart as unknown as {
          getModel: () => { getComponent: (mainType: string, idx?: number) => unknown };
        }
      ).getModel();
      expect(model.getComponent("markLine", 0)).toBeTruthy();
      const svg = (chart as unknown as { renderToSVGString: () => string }).renderToSVGString();
      expect(svg).toContain("Budget");
    } finally {
      chart.dispose();
    }
  });

  it("compiles two yAxisId values to two series", () => {
    const option = compileLineOption(
      makeCtx({
        parts: [
          salesLine,
          leftAxis,
          rightAxis,
          { type: "referenceLine", id: "a", y: 10, yAxisId: "left" } satisfies ReferenceLinePart,
          { type: "referenceLine", id: "b", y: 90, yAxisId: "right" } satisfies ReferenceLinePart,
        ],
        xDataKey: "month",
        data: rows,
      }),
    );

    expect(refSeries(option, 0)?.yAxisIndex).toBe(0);
    expect(refSeries(option, 0)?.markLine?.data?.map((d) => d.yAxis)).toEqual([10]);
    expect(refSeries(option, 1)?.yAxisIndex).toBe(1);
    expect(refSeries(option, 1)?.markLine?.data?.map((d) => d.yAxis)).toEqual([90]);
  });

  it("puts a right-axis band on yAxisIndex 1", () => {
    const option = compileLineOption(
      makeCtx({
        parts: [
          salesLine,
          leftAxis,
          rightAxis,
          {
            type: "referenceBand",
            id: "band",
            y: [20, 40],
            yAxisId: "right",
          } satisfies ReferenceBandPart,
        ],
        xDataKey: "month",
        data: rows,
      }),
    );

    expect(refSeries(option, 1)?.yAxisIndex).toBe(1);
    expect(refSeries(option, 0)).toBeUndefined();
    const pair = refSeries(option, 1)?.markArea?.data?.[0];
    expect(pair?.[0]?.yAxis).toBe(20);
    expect(pair?.[1]?.yAxis).toBe(40);
  });

  it("raises an auto axis max for a line above the data", () => {
    const option = compileLineOption(
      makeCtx({
        parts: [
          salesLine,
          { type: "referenceLine", id: "high", y: 80 } satisfies ReferenceLinePart,
        ],
        xDataKey: "month",
        data: rows,
      }),
    );

    const axis = yAxes(option)[0];
    expect(typeof axis?.max).toBe("function");
    const max = axis?.max as (extent: { min: number; max: number }) => number;
    expect(max({ min: 0, max: 20 })).toBe(80);
  });

  it("lowers an auto axis min for a line below the data", () => {
    const option = compileLineOption(
      makeCtx({
        parts: [
          salesLine,
          { type: "referenceLine", id: "low", y: -15 } satisfies ReferenceLinePart,
        ],
        xDataKey: "month",
        data: rows,
      }),
    );

    const axis = yAxes(option)[0];
    const min = axis?.min as (extent: { min: number; max: number }) => number;
    expect(min({ min: 10, max: 20 })).toBe(-15);
  });

  it("leaves an explicit axis max alone", () => {
    const option = compileLineOption(
      makeCtx({
        parts: [
          salesLine,
          { type: "yAxis", id: "y", domain: [0, 40] },
          { type: "referenceLine", id: "high", y: 80 } satisfies ReferenceLinePart,
        ],
        xDataKey: "month",
        data: rows,
      }),
    );

    const axis = yAxes(option)[0];
    expect(axis?.max).toBe(40);
    expect(axis?.min).toBe(0);
  });

  it("does not extend the axis when includeInDomain is false", () => {
    const option = compileLineOption(
      makeCtx({
        parts: [
          salesLine,
          {
            type: "referenceLine",
            id: "high",
            y: 80,
            includeInDomain: false,
          } satisfies ReferenceLinePart,
        ],
        xDataKey: "month",
        data: rows,
      }),
    );

    const axis = yAxes(option)[0];
    expect(axis?.max).toBeUndefined();
    expect(refSeries(option, 0)?.markLine?.data?.[0]?.yAxis).toBe(80);
  });

  it("compiles an open band to the axis edge", () => {
    const option = compileLineOption(
      makeCtx({
        parts: [
          salesLine,
          { type: "referenceBand", id: "open", y: [100, null] } satisfies ReferenceBandPart,
        ],
        xDataKey: "month",
        data: rows,
      }),
    );

    const pair = refSeries(option, 0)?.markArea?.data?.[0];
    expect(pair?.[0]?.yAxis).toBe(100);
    expect(pair?.[1]?.yAxis).toBe("max");
  });

  it("draws two marks at the same value", () => {
    const option = compileLineOption(
      makeCtx({
        parts: [
          salesLine,
          { type: "referenceLine", id: "a", y: 10, label: "A" } satisfies ReferenceLinePart,
          { type: "referenceLine", id: "b", y: 10, label: "B" } satisfies ReferenceLinePart,
        ],
        xDataKey: "month",
        data: rows,
      }),
    );

    const marks = refSeries(option, 0)?.markLine?.data;
    expect(marks?.map((d) => d.yAxis)).toEqual([10, 10]);
    expect(marks?.[0]?.label?.position).toBe("insideEndTop");
    expect(marks?.[0]?.label?.distance).toEqual([64, 6]);
  });

  it("reserves room above a labeled line that is the axis max", () => {
    const option = compileLineOption(
      makeCtx({
        parts: [
          salesLine,
          { type: "referenceLine", id: "stretch", y: 40, label: "Stretch" } satisfies ReferenceLinePart,
        ],
        xDataKey: "month",
        data: rows,
      }),
    );

    const grid = option.grid as { top?: number };
    expect(grid.top).toBeGreaterThanOrEqual(28);
  });

  it("leaves the top padding alone when the labeled line is inside the data", () => {
    const option = compileLineOption(
      makeCtx({
        parts: [
          salesLine,
          { type: "referenceLine", id: "mid", y: 15, label: "Mid" } satisfies ReferenceLinePart,
        ],
        xDataKey: "month",
        data: rows,
      }),
    );

    const grid = option.grid as { top?: number };
    expect(grid.top).toBe(14);
  });

  it("warns for an unknown yAxisId and uses axis 0", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const option = compileLineOption(
      makeCtx({
        chartId: "warn-chart",
        parts: [
          salesLine,
          leftAxis,
          rightAxis,
          {
            type: "referenceLine",
            id: "miss",
            y: 5,
            yAxisId: "missing-axis",
          } satisfies ReferenceLinePart,
        ],
        xDataKey: "month",
        data: rows,
      }),
    );

    const series = seriesOf(option).find((s) => s.id === "warn-chart-ref-0");
    expect(series?.yAxisIndex).toBe(0);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("missing-axis"));
  });

  it("leaves a gap in RangeArea and adds no legend entry", () => {
    const resolveColor = vi.fn((key: string) => `color(${key})`);
    const option = compileLineOption(
      makeCtx({
        resolveColor,
        parts: [
          { type: "line", id: "line-actual", dataKey: "actual" },
          {
            type: "rangeArea",
            id: "band",
            lowKey: "lo",
            highKey: "hi",
            yAxisId: "left",
          },
          leftAxis,
        ],
        xDataKey: "month",
        data: [
          { month: "Jan", actual: 10, lo: 4, hi: 12 },
          { month: "Feb", actual: 12, lo: null, hi: 14 },
          { month: "Mar", actual: 11, lo: 6, hi: 15 },
        ],
      }),
    );

    const series = seriesOf(option);
    const low = series.find((s) => s.id === "test-chart-range-0-low");
    const span = series.find((s) => s.id === "test-chart-range-0-span");
    expect(low?.data).toEqual([4, null, 6]);
    expect(span?.data).toEqual([8, null, 9]);
    expect(low?.connectNulls).toBe(false);
    expect(span?.connectNulls).toBe(false);
    expect(low?.yAxisIndex).toBe(0);
    expect(span?.areaStyle?.opacity).toBe(0.15);
    expect(low?.tooltip?.show).toBe(false);
    expect(span?.tooltip?.show).toBe(false);

    const names = series.map((s) => s.name).filter(Boolean);
    expect(names).toEqual(["actual"]);
    expect(resolveColor.mock.calls.map((call) => call[0])).not.toContain("lo");
    expect(resolveColor.mock.calls.map((call) => call[0])).not.toContain("hi");
  });
});
