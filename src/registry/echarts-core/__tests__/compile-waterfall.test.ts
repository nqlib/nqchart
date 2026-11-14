import { describe, expect, it } from "vitest";
import { FOCUS } from "../emphasis-presets";
import { compileWaterfallOption, formatWaterfallDelta } from "../compile-waterfall";
import { buildWaterfallSteps } from "../waterfall-steps";
import type { WaterfallPart } from "../parts/types";
import { resolveChartSignature } from "../chart-signature";
import { makeCtx } from "./make-ctx";

const waterfallPart: WaterfallPart = {
  type: "waterfall",
  id: "wf-1",
  nameKey: "name",
  valueKey: "value",
  typeKey: "type",
};

describe("compileWaterfallOption", () => {
  it("builds placeholder and value bars for start/increase/decrease/total", () => {
    const option = compileWaterfallOption(
      makeCtx({
        parts: [waterfallPart],
        data: [
          { name: "Start", value: 100, type: "start" },
          { name: "Gain", value: 50, type: "increase" },
          { name: "Loss", value: -20, type: "decrease" },
          { name: "Total", value: 130, type: "total" },
        ],
      }),
    );

    const series = option.series as Array<{
      name?: string;
      data: number[] | unknown[];
      stateAnimation?: { duration?: number };
      animationDurationUpdate?: number;
      emphasis?: { focus?: string; disabled?: boolean };
      blur?: { itemStyle?: { opacity?: number } };
    }>;
    expect(series.length).toBeGreaterThanOrEqual(2);
    const values = series.find((s) => s.name === "__wf_values__");
    expect(values?.data).toBeDefined();
    expect(values?.stateAnimation?.duration).toBe(FOCUS.durationMs);
    expect(values?.animationDurationUpdate).toBe(0);
    expect(values?.emphasis?.focus).toBe("self");
    expect(values?.emphasis?.disabled).toBe(true);
    expect(values?.blur?.itemStyle?.opacity).toBe(0.2);
  });

  it("returns empty-ish option for empty data", () => {
    const option = compileWaterfallOption(makeCtx({ parts: [waterfallPart], data: [] }));
    expect(option.series).toBeDefined();
  });

  it("rounds columns from the signature, honours barRadius, and keeps the zero line square", () => {
    const data = [
      { name: "Start", value: 100, type: "start" },
      { name: "Gain", value: 50, type: "increase" },
      { name: "Loss", value: -20, type: "decrease" },
      { name: "Total", value: 130, type: "total" },
    ];
    type Pt = { itemStyle: { borderRadius: number[] } };
    const radii = (cartesian?: { barRadius: number }) => {
      const series = compileWaterfallOption(
        makeCtx({ parts: [waterfallPart], data, cartesian }),
      ).series as Array<{ name?: string; data: Pt[] }>;
      return series.find((s) => s.name === "__wf_values__")!.data.map((d) => d.itemStyle.borderRadius);
    };
    const mark = resolveChartSignature("test-chart").radius.mark;
    // Only the end a column moves to is rounded: up → top, down → bottom.
    expect(radii()).toEqual([
      [mark, mark, 0, 0],
      [mark, mark, 0, 0],
      [0, 0, mark, mark],
      [mark, mark, 0, 0],
    ]);
    expect(radii({ barRadius: 6 })[0]).toEqual([6, 6, 0, 0]);
    expect(radii({ barRadius: 0 })[1]).toEqual([0, 0, 0, 0]);
  });
});

type Series = {
  id?: string;
  type?: string;
  stackStrategy?: string;
  data: unknown[];
};
const seriesOf = (option: ReturnType<typeof compileWaterfallOption>) =>
  option.series as Series[];
const byId = (option: ReturnType<typeof compileWaterfallOption>, id: string) =>
  seriesOf(option).find((s) => s.id === id)!;
type Datum = { value: number; itemStyle: { color: string }; label: { position: string } };

describe("buildWaterfallSteps", () => {
  it("tracks the running total; start and total draw from zero", () => {
    const steps = buildWaterfallSteps(
      [
        { name: "a", value: 10, type: "start" },
        { name: "b", value: -30 },
        { name: "c", value: 5 },
        { name: "d", value: -15, type: "total" },
      ],
      "value",
      "type",
    );
    expect(steps.map((s) => [s.direction, s.start, s.end])).toEqual([
      ["total", 0, 10],
      ["decrease", 10, -20],
      ["increase", -20, -15],
      ["total", 0, -15],
    ]);
  });
});

describe("compileWaterfallOption — direction, layout, connectors", () => {
  const data = [
    { name: "Start", value: 10, type: "start" },
    { name: "Drop", value: -30, type: "decrease" },
    { name: "Gain", value: 5, type: "increase" },
    { name: "End", value: -15, type: "total" },
  ];

  it("stacks across signs so a step that crosses zero starts at the running total", () => {
    const option = compileWaterfallOption(makeCtx({ parts: [waterfallPart], data }));
    const base = byId(option, "__wf_placeholder__");
    const values = byId(option, "__wf_values__");
    expect(base.stackStrategy).toBe("all");
    expect(values.stackStrategy).toBe("all");
    // Columns 0→10, 10→−20, −20→−15, 0→−15 as placeholder + length.
    expect(base.data).toEqual([0, -20, -20, 0]);
    expect((values.data as Datum[]).map((d) => d.value)).toEqual([10, 30, 5, -15]);
  });

  it("colors by direction from config keys, and higherIsBetter=false swaps the defaults", () => {
    const colors = (part: WaterfallPart, config = {}) =>
      (byId(compileWaterfallOption(makeCtx({ parts: [part], data, config })), "__wf_values__")
        .data as Datum[]).map((d) => d.itemStyle.color);
    const good = colors(waterfallPart);
    expect(good[1]).toBe("#dc2626"); // decrease → red
    expect(good[2]).toBe("#059669"); // increase → green
    expect(good[0]).toBe(good[3]); // start and total share the total color
    const cost = colors({ ...waterfallPart, higherIsBetter: false });
    expect(cost[1]).toBe("#059669");
    expect(cost[2]).toBe("#dc2626");
  });

  it("colorBy=category resolves each column's own key", () => {
    const seen: string[] = [];
    const ctx = makeCtx({ parts: [{ ...waterfallPart, colorBy: "category" }], data });
    compileWaterfallOption({ ...ctx, resolveColor: (k) => (seen.push(k), "#000") });
    expect(seen).toEqual(["Start", "Drop", "Gain", "End"]);
  });

  it("signed labels sit at the moving end", () => {
    const values = byId(compileWaterfallOption(makeCtx({ parts: [waterfallPart], data })), "__wf_values__");
    expect((values.data as Datum[]).map((d) => d.label.position)).toEqual(["top", "bottom", "top", "bottom"]);
    const steps = buildWaterfallSteps(data, "value", "type");
    expect(steps.map(formatWaterfallDelta)).toEqual(["10", "\u221230", "+5", "\u221215"]);
  });

  it("draws no connectors by default, and one per gap at the running total when on", () => {
    const off = compileWaterfallOption(makeCtx({ parts: [waterfallPart], data }));
    expect(seriesOf(off).some((s) => s.id === "__wf_connectors__")).toBe(false);
    const on = byId(
      compileWaterfallOption(makeCtx({ parts: [{ ...waterfallPart, connectors: true }], data })),
      "__wf_connectors__",
    );
    expect(on.type).toBe("custom");
    expect(on.data).toEqual([[0, 10], [1, -20], [2, -15]]);
  });

  it("horizontal: categories on an inverse y axis, rows round their right / left end", () => {
    const option = compileWaterfallOption(
      makeCtx({ parts: [{ ...waterfallPart, connectors: true }], data, cartesian: { layout: "horizontal" } }),
    );
    const y = option.yAxis as { type: string; inverse?: boolean };
    expect(y.type).toBe("category");
    expect(y.inverse).toBe(true);
    expect((option.xAxis as { type: string }).type).toBe("value");
    const values = byId(option, "__wf_values__").data as Array<Datum & { itemStyle: { borderRadius: number[] } }>;
    expect(values[1]!.label.position).toBe("left");
    const mark = resolveChartSignature("test-chart").radius.mark;
    expect(values[2]!.itemStyle.borderRadius).toEqual([0, mark, mark, 0]);
    expect(byId(option, "__wf_connectors__").data).toEqual([[10, 0], [-20, 1], [-15, 2]]);
  });

  it("reserves canvas room for a label on a step at the axis max", () => {
    const grid = (part: WaterfallPart, layout?: "horizontal") =>
      compileWaterfallOption(
        makeCtx({ parts: [part], data, ...(layout ? { cartesian: { layout } } : {}) }),
      ).grid as { top: number; right: number };
    expect(grid(waterfallPart).top).toBeGreaterThanOrEqual(28);
    expect(grid(waterfallPart, "horizontal").right).toBeGreaterThanOrEqual(30);
    expect(grid({ ...waterfallPart, showLabels: false }).top).toBe(14);
  });
});
