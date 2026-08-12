import { describe, expect, it } from "vitest";
import { mapEChartsClickToMarkEvent, NQ_DATUM, NQ_SERIES_KEY } from "../nq-mark-event";
import { resolveYAxisIndex, buildValueYAxes } from "../cartesian-axes";
import type { YAxisPart } from "../parts/types";

describe("mapEChartsClickToMarkEvent", () => {
  const data = [
    { month: "Jan", sales: 10 },
    { month: "Feb", sales: 20 },
  ];

  it("maps a series click to NQMarkEvent with raw category", () => {
    const event = mapEChartsClickToMarkEvent(
      {
        componentType: "series",
        seriesName: "sales",
        dataIndex: 1,
        value: 20,
        name: "Feb",
        event: { event: { shiftKey: true, metaKey: false, altKey: false, ctrlKey: true } },
      },
      { data, xDataKey: "month" },
    );
    expect(event).toEqual({
      category: "Feb",
      categoryLabel: "Feb",
      seriesKey: "sales",
      datum: { month: "Feb", sales: 20 },
      value: 20,
      index: 1,
      modifiers: { shift: true, meta: false, alt: false, ctrl: true },
    });
  });

  it("maps display seriesName to config dataKey via seriesKeyFromName", () => {
    const event = mapEChartsClickToMarkEvent(
      {
        componentType: "series",
        seriesName: "Planned cost",
        dataIndex: 0,
        value: 10,
        name: "Jan",
      },
      {
        data: [{ month: "Jan", planned: 10 }],
        xDataKey: "month",
        seriesKeyFromName: (name) => (name === "Planned cost" ? "planned" : name),
      },
    );
    expect(event?.seriesKey).toBe("planned");
    expect(event?.datum).toEqual({ month: "Jan", planned: 10 });
  });

  it("prefers seriesId (= dataKey) over display seriesName", () => {
    const event = mapEChartsClickToMarkEvent(
      {
        componentType: "series",
        seriesId: "planned",
        seriesName: "Planned cost",
        dataIndex: 0,
        value: 10,
        name: "Jan",
      },
      { data: [{ month: "Jan", planned: 10 }], xDataKey: "month" },
    );
    expect(event?.seriesKey).toBe("planned");
  });

  it("adds indexOffset for brush-window clicks", () => {
    const full = [
      { month: "Jan", sales: 10 },
      { month: "Feb", sales: 20 },
      { month: "Mar", sales: 30 },
    ];
    const event = mapEChartsClickToMarkEvent(
      {
        componentType: "series",
        seriesName: "sales",
        dataIndex: 0,
        value: 30,
        name: "Mar",
      },
      { data: full, xDataKey: "month", indexOffset: 2 },
    );
    expect(event?.index).toBe(2);
    expect(event?.category).toBe("Mar");
    expect(event?.datum).toEqual({ month: "Mar", sales: 30 });
  });

  it("maps pie clicks via nameKey and embedded series key", () => {
    const pieRows = [
      { name: "Alpha", value: 40 },
      { name: "Beta", value: 35 },
    ];
    const event = mapEChartsClickToMarkEvent(
      {
        componentType: "series",
        seriesType: "pie",
        dataIndex: 1,
        name: "Beta Label",
        value: 35,
        data: {
          name: "Beta Label",
          value: 35,
          [NQ_SERIES_KEY]: "Beta",
          [NQ_DATUM]: pieRows[1],
        },
      },
      { data: pieRows, nameKey: "name", valueKey: "value" },
    );
    expect(event).toMatchObject({
      seriesKey: "Beta",
      category: "Beta",
      value: 35,
      index: 1,
      datum: pieRows[1],
    });
  });

  it("maps scatter clicks from embedded datum and series key", () => {
    const point = { x: 12, y: 34 };
    const event = mapEChartsClickToMarkEvent(
      {
        componentType: "series",
        seriesType: "scatter",
        dataIndex: 0,
        value: [12, 34],
        data: {
          name: "Desktop",
          value: [12, 34],
          [NQ_SERIES_KEY]: "desktop",
          [NQ_DATUM]: point,
        },
      },
      { data: [] },
    );
    expect(event).toMatchObject({
      seriesKey: "desktop",
      datum: point,
      value: 34,
      index: 0,
    });
  });

  it("ignores waterfall placeholder series", () => {
    expect(
      mapEChartsClickToMarkEvent(
        {
          componentType: "series",
          seriesId: "__wf_placeholder__",
          seriesName: "__wf_placeholder__",
          dataIndex: 0,
          value: 0,
        },
        { data: [{ name: "A", value: 10 }], xDataKey: "name" },
      ),
    ).toBeNull();
  });

  it("ignores non-series clicks and reference series", () => {
    expect(
      mapEChartsClickToMarkEvent(
        { componentType: "xAxis", dataIndex: 0 },
        { data, xDataKey: "month" },
      ),
    ).toBeNull();
    expect(
      mapEChartsClickToMarkEvent(
        {
          componentType: "series",
          seriesId: "__nq_reference__",
          seriesName: "sales",
          dataIndex: 0,
          value: 10,
        },
        { data, xDataKey: "month" },
      ),
    ).toBeNull();
  });

  it("ignores null marks", () => {
    const sparse = [{ month: "Jan", sales: null as unknown as number }];
    expect(
      mapEChartsClickToMarkEvent(
        {
          componentType: "series",
          seriesName: "sales",
          dataIndex: 0,
          value: null,
          data: sparse[0],
        },
        { data: sparse, xDataKey: "month" },
      ),
    ).toBeNull();
  });
});

describe("resolveYAxisIndex", () => {
  const axes: YAxisPart[] = [
    { type: "yAxis", id: "1", yAxisId: "left", orientation: "left" },
    { type: "yAxis", id: "2", yAxisId: "right", orientation: "right" },
  ];

  it("maps yAxisId to axis index and falls back safely", () => {
    expect(resolveYAxisIndex("right", axes)).toBe(1);
    expect(resolveYAxisIndex("left", axes)).toBe(0);
    expect(resolveYAxisIndex("right", [axes[0]!])).toBe(0);
    expect(resolveYAxisIndex(undefined, axes)).toBe(0);
  });
});

describe("buildValueYAxes", () => {
  it("applies tickFormatter and log scale", () => {
    const axes = buildValueYAxes({
      yAxes: [
        {
          type: "yAxis",
          id: "1",
          scale: "log",
          tickFormatter: (v) => `$${v}`,
        },
      ],
      hasGrid: true,
    });
    expect(axes[0]).toMatchObject({ type: "log" });
    const label = axes[0] as { axisLabel?: { formatter?: (v: unknown, i: number) => string } };
    expect(label.axisLabel?.formatter?.(12, 0)).toBe("$12");
  });
});
