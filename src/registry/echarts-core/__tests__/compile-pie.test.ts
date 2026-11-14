import { describe, expect, it } from "vitest";
import { FOCUS } from "../emphasis-presets";
import { applyChartAnimationToOption } from "../apply-chart-animation";
import { compilePieOption } from "../compile-pie";
import { CIRCULAR_LABELED_OUTER_RADIUS } from "../chart-signature";
import type { PieSeriesPart } from "../parts/types";
import { makeCtx } from "./make-ctx";

const piePart: PieSeriesPart = {
  type: "pie",
  id: "pie-1",
  dataKey: "value",
  nameKey: "name",
};

describe("compilePieOption", () => {
  it("returns a series array for empty data without throwing", () => {
    const option = compilePieOption(makeCtx({ parts: [piePart] }));
    expect(option.series).toBeDefined();
    expect(Array.isArray(option.series)).toBe(true);
    expect((option.series as unknown[]).length).toBeGreaterThan(0);
  });

  it("uses the FOCUS fade, instant geometry and self focus", () => {
    const option = compilePieOption(
      makeCtx({
        parts: [piePart],
        data: [
          { name: "alpha", value: 10 },
          { name: "beta", value: 20 },
        ],
      }),
    );
    const series = (
      option.series as Array<{
        animationDurationUpdate?: number;
        emphasis?: { focus?: string; disabled?: boolean };
        stateAnimation?: { duration?: number };
      }>
    )[0]!;
    expect(series.animationDurationUpdate).toBe(0);
    expect(series.stateAnimation?.duration).toBe(FOCUS.durationMs);
    expect(series.emphasis?.focus).toBe("self");
    expect(series.emphasis?.disabled).toBe(false);
  });

  it("keeps animationDurationUpdate at 0 after applyChartAnimationToOption", () => {
    const option = compilePieOption(
      makeCtx({
        parts: [piePart],
        data: [{ name: "alpha", value: 10 }],
      }),
    );
    const animated = applyChartAnimationToOption(option);
    const series = (animated.series as Array<{ animationDurationUpdate?: number }>)[0]!;
    expect(series.animationDurationUpdate).toBe(0);
  });

  it("maps names, values, and colors from a 3-row dataset", () => {
    const option = compilePieOption(
      makeCtx({
        parts: [piePart],
        data: [
          { name: "alpha", value: 10 },
          { name: "beta", value: 20 },
          { name: "gamma", value: 30 },
        ],
      }),
    );

    const series = (option.series as Array<{ data: Array<{ name: string; value: number; itemStyle: { color: string } }> }>)[0]!;
    expect(series.data).toHaveLength(3);
    expect(series.data[0]).toMatchObject({ name: "alpha", value: 10, itemStyle: { color: "color(alpha,0)" } });
    expect(series.data[1]).toMatchObject({ name: "beta", value: 20 });
    expect(series.data[2]).toMatchObject({ name: "gamma", value: 30 });
  });

  it("uses config label override for slice names", () => {
    const option = compilePieOption(
      makeCtx({
        parts: [piePart],
        config: { alpha: { label: "Alpha Co" } },
        data: [{ name: "alpha", value: 5 }],
      }),
    );

    const series = (option.series as Array<{ data: Array<{ name: string }> }>)[0]!;
    expect(series.data[0]?.name).toBe("Alpha Co");
  });

  it("matches snapshot for a representative context", () => {
    const option = compilePieOption(
      makeCtx({
        parts: [piePart],
        data: [
          { name: "a", value: 1 },
          { name: "b", value: 2 },
        ],
        config: { a: { label: "Slice A" } },
      }),
    );
    expect(option).toMatchSnapshot();
  });
});

describe("compilePieOption — rose", () => {
  type Child = { type?: string; shape?: { pathData?: string }; style?: { text?: string; opacity?: number }; blur?: unknown };
  type RoseSeries = {
    id?: string;
    type?: string;
    data?: Array<{ name: string; value: number }>;
    renderItem?: (
      params: { dataIndex: number },
      api: { getWidth: () => number; getHeight: () => number; style: () => { opacity?: number } },
    ) => { children?: Child[] } | undefined;
  };
  const rows = [
    { channel: "Ads", visits: 600 },
    { channel: "Search", visits: 4200 },
    { channel: "Email", visits: 1800 },
  ];
  const api = { getWidth: () => 400, getHeight: () => 400, style: () => ({}) };

  function compileRose(pie: Partial<PieSeriesPart> = {}, hoverFocus?: boolean) {
    const option = compilePieOption(
      makeCtx({
        data: rows,
        nameKey: "channel",
        hoverFocus,
        parts: [{ type: "pie", id: "p", dataKey: "visits", nameKey: "channel", rose: "radius", ...pie }],
      }),
    );
    return (option.series as RoseSeries[])[0]!;
  }

  it("compiles a custom signature series sorted largest first", () => {
    const s = compileRose();
    expect(s.type).toBe("custom");
    expect(s.id).toBe("nq-pie-rose");
    expect(s.data!.map((d) => d.name)).toEqual(["Search", "Email", "Ads"]);
  });

  it("keeps data order when sort is none", () => {
    expect(compileRose({ sort: "none" }).data!.map((d) => d.name)).toEqual(["Ads", "Search", "Email"]);
  });

  it("draws each slice as a rounded path with arcs; labels are off by default", () => {
    const group = compileRose().renderItem!({ dataIndex: 0 }, api)!;
    const path = group.children!.find((c) => c.type === "path")!.shape!.pathData!;
    expect(path).toMatch(/\bA\b/);
    expect(path).not.toMatch(/NaN/);
    expect(group.children!.some((c) => c.type === "text")).toBe(false);
  });

  it("shows outside labels when asked", () => {
    const group = compileRose({ showLabels: true }).renderItem!({ dataIndex: 0 }, api)!;
    expect(group.children!.find((c) => c.type === "text")?.style?.text).toBe("Search");
  });

  it("honors legend isolate opacity and the hover-focus opt-out", () => {
    const dimmed = compileRose().renderItem!(
      { dataIndex: 1 },
      { ...api, style: () => ({ opacity: 0.2 }) },
    )!;
    expect(dimmed.children![0]!.style!.opacity).toBe(0.2);
    expect(dimmed.children![0]!.blur).toBeDefined();
    const off = compileRose({}, false).renderItem!({ dataIndex: 0 }, api)!;
    expect(off.children![0]!.blur).toBeUndefined();
  });

  it("draws the plain pie with the signature renderer and leader-line labels", () => {
    const option = compilePieOption(
      makeCtx({ data: rows, nameKey: "channel", parts: [{ type: "pie", id: "p", dataKey: "visits", nameKey: "channel" }] }),
    );
    const s = (option.series as RoseSeries[])[0]!;
    expect(s.type).toBe("custom");
    expect(s.id).toBe("nq-pie");
    // Data order kept for a plain pie.
    expect(s.data!.map((d) => d.name)).toEqual(["Ads", "Search", "Email"]);
    const group = s.renderItem!({ dataIndex: 1 }, api)!;
    const types = group.children!.map((c) => c.type);
    expect(types).toEqual(["path", "polyline", "text"]);
    expect(group.children!.find((c) => c.type === "text")!.style!.text).toBe("Search");
  });

  it("hides labels with showLabels={false}", () => {
    const option = compilePieOption(
      makeCtx({ data: rows, nameKey: "channel", parts: [{ type: "pie", id: "p", dataKey: "visits", nameKey: "channel", showLabels: false }] }),
    );
    const group = (option.series as RoseSeries[])[0]!.renderItem!({ dataIndex: 0 }, api)!;
    expect(group.children!.map((c) => c.type)).toEqual(["path"]);
  });
});

describe("compilePieOption — rose element focus", () => {
  it("puts focus/blurScope on the returned group (ECharts ignores series.emphasis for custom)", () => {
    const option = compilePieOption(
      makeCtx({
        data: [
          { c: "A", v: 3 },
          { c: "B", v: 1 },
        ],
        nameKey: "c",
        parts: [{ type: "pie", id: "p", dataKey: "v", nameKey: "c", rose: "radius" }],
      }),
    );
    const series = (option.series as Array<{
      renderItem: (
        p: { dataIndex: number },
        api: { getWidth: () => number; getHeight: () => number; style: () => object },
      ) => { focus?: string; blurScope?: string };
    }>)[0]!;
    const group = series.renderItem({ dataIndex: 0 }, { getWidth: () => 300, getHeight: () => 300, style: () => ({}) });
    expect(group.focus).toBe("self");
    expect(group.blurScope).toBe("series");
  });
});

describe("compilePieOption — default size", () => {
  it("uses the shared labeled circular radius, the same as radar", () => {
    type Group = { children?: Array<{ type?: string; shape?: { pathData?: string } }> };
    const option = compilePieOption(
      makeCtx({
        data: [
          { name: "A", value: 3 },
          { name: "B", value: 2 },
          { name: "C", value: 1 },
        ],
        parts: [{ ...piePart }],
      }),
    );
    const series = (option.series as Array<{
      renderItem: (
        p: { dataIndex: number },
        api: { getWidth: () => number; getHeight: () => number; style: () => object },
      ) => Group;
    }>)[0]!;
    const group = series.renderItem({ dataIndex: 0 }, { getWidth: () => 400, getHeight: () => 400, style: () => ({}) });
    const path = group.children!.find((c) => c.type === "path")!.shape!.pathData!;
    // Largest arc radius in the slice outline is the rim. 65% of half of 400.
    const radii = [...path.matchAll(/A\s*([\d.]+)/g)].map((m) => Number(m[1]));
    expect(Math.max(...radii)).toBeCloseTo((Number.parseFloat(CIRCULAR_LABELED_OUTER_RADIUS) / 100) * 200, 1);
  });
});
