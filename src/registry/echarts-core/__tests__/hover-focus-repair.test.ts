import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import * as echarts from "echarts/core";
import type { EChartsOption } from "echarts";
import { BarChart, FunnelChart, HeatmapChart, PieChart, ScatterChart, TreemapChart } from "echarts/charts";
import { GridComponent, PolarComponent, VisualMapComponent } from "echarts/components";
import { SVGRenderer } from "echarts/renderers";
import type { EChartsType } from "echarts/core";
import {
  clearFocus,
  focusMark,
  hasPendingRepair,
  listFocusTargets,
  markParamsAt,
  resolveRepairAdapter,
  scheduleHoverFocusRepair,
  setHoverFocusEnabled,
  waterfallValuesSeriesIndex,
  WATERFALL_PLACEHOLDER_SERIES,
  WATERFALL_VALUES_SERIES,
} from "../hover-focus-repair";
import { resolveKeyboardTarget } from "../use-keyboard-mark-nav";

const NORMAL = 0;
const BLUR = 1;
const EMPHASIS = 2;

/** Frames run only when the test flushes them — models a late double rAF. */
let frames: Array<() => void> = [];
function flushFrames(): void {
  // Two passes: a double rAF schedules its inner frame from the outer one.
  for (let pass = 0; pass < 3; pass++) {
    const run = frames;
    frames = [];
    run.forEach((fn) => fn());
  }
}

beforeAll(() => {
  echarts.use([
    BarChart,
    FunnelChart,
    HeatmapChart,
    PieChart,
    ScatterChart,
    TreemapChart,
    GridComponent,
    PolarComponent,
    VisualMapComponent,
    SVGRenderer,
  ]);
  let id = 0;
  vi.stubGlobal("requestAnimationFrame", (fn: () => void) => {
    frames.push(fn);
    return ++id;
  });
  vi.stubGlobal("cancelAnimationFrame", () => {
    // Cancelled frames are dropped by the guard; nothing to do in the stub.
  });
});

const charts: EChartsType[] = [];
afterEach(() => {
  frames = [];
  charts.splice(0).forEach((c) => c.dispose());
});

function chart(option: EChartsOption): EChartsType {
  const c = echarts.init(null, undefined, { renderer: "svg", ssr: true, width: 400, height: 300 });
  c.setOption({ animation: false, ...option });
  charts.push(c);
  return c;
}

const tick = () => new Promise<void>((resolve) => queueMicrotask(resolve));

function states(c: EChartsType, seriesIndex: number, pick?: (el: unknown) => unknown): number[] {
  const model = (c as unknown as {
    getModel(): { getSeriesByIndex(i: number): { getData(): { count(): number; getItemGraphicEl(i: number): unknown } } };
  }).getModel();
  const data = model.getSeriesByIndex(seriesIndex).getData();
  const out: number[] = [];
  for (let i = 0; i < data.count(); i++) {
    const el = data.getItemGraphicEl(i);
    const target = (pick ? pick(el) : el) as { hoverState?: number } | null;
    out.push(target?.hoverState ?? NORMAL);
  }
  return out;
}

const keepNormalItem = {
  emphasis: { focus: "self" as const, disabled: true },
  blur: { itemStyle: { opacity: 0.2 } },
};

const pie = (): EChartsOption => ({
  series: [{ type: "pie", ...keepNormalItem, data: [1, 2, 3, 4].map((v) => ({ name: `p${v}`, value: v })) }],
});

const waterfall = (): EChartsOption => ({
  xAxis: { type: "category", data: ["a", "b", "c"] },
  yAxis: { type: "value" },
  series: [
    { type: "bar", id: WATERFALL_PLACEHOLDER_SERIES, name: WATERFALL_PLACEHOLDER_SERIES, stack: "wf", silent: true, data: [0, 10, 5] },
    { type: "bar", id: WATERFALL_VALUES_SERIES, name: WATERFALL_VALUES_SERIES, stack: "wf", ...keepNormalItem, data: [10, 5, 3] },
  ],
});

const scatter = (): EChartsOption => ({
  xAxis: { type: "value" },
  yAxis: { type: "value" },
  series: [{ type: "scatter", data: [[1, 1], [2, 2], [3, 3]], emphasis: { focus: "self" } }],
});

const radial = (): EChartsOption => ({
  polar: {},
  angleAxis: { max: 10 },
  radiusAxis: { type: "category", data: ["a", "b", "c"] },
  series: ["a", "b", "c"].map((_, ring) => ({
    type: "bar",
    coordinateSystem: "polar",
    stack: "ring",
    emphasis: { focus: "series", disabled: true },
    data: [0, 1, 2].map((i) => (i === ring ? 5 + ring : null)),
  })),
});

describe("focusMark → repair adapters", () => {
  it.each([
    ["pie", pie, 0, 2, [BLUR, BLUR, NORMAL, BLUR]],
    ["waterfall", waterfall, 1, 1, [BLUR, NORMAL, BLUR]],
  ] as const)("%s keeps the focused mark normal and blurs its siblings", async (_family, opt, si, di, expected) => {
    const c = chart(opt());
    focusMark(c, { seriesIndex: si, dataIndex: di }, "keyboard");
    await tick();
    expect(states(c, si)).toEqual(expected);
  });

  it("treemap: blurs sibling leaves, never emphasises the hovered tile (vanish fix)", async () => {
    const c = chart({
      series: [{ type: "treemap", ...keepNormalItem, data: [{ name: "a", value: 3 }, { name: "b", value: 2 }, { name: "c", value: 1 }] }],
    });
    const leaves = listFocusTargets(c);
    expect(leaves.length).toBe(3);
    focusMark(c, leaves[0]!, "keyboard");
    await tick();
    const s = states(c, 0);
    expect(s[leaves[0]!.dataIndex!]).toBe(NORMAL);
    expect(s.filter((v) => v === EMPHASIS)).toHaveLength(0);
    expect(s[leaves[1]!.dataIndex!]).toBe(BLUR);
  });

  it("funnel (classic series) uses the repair; resolves adapter by subType", async () => {
    const c = chart({ series: [{ type: "funnel", ...keepNormalItem, data: [{ name: "a", value: 3 }, { name: "b", value: 2 }] }] });
    expect(resolveRepairAdapter(c, 0)?.family).toBe("funnel");
    focusMark(c, { seriesIndex: 0, dataIndex: 1 }, "pointer");
    await tick();
    expect(states(c, 0)).toEqual([BLUR, NORMAL]);
  });

  it("scatter emphasises the hovered Symbol path after a double rAF", () => {
    const c = chart(scatter());
    const path = (el: unknown) => (el as { childAt(i: number): unknown }).childAt(0);
    focusMark(c, { seriesIndex: 0, dataIndex: 1 }, "pointer");
    expect(states(c, 0, path)).toEqual([NORMAL, NORMAL, NORMAL]);
    flushFrames();
    expect(states(c, 0, path)).toEqual([BLUR, EMPHASIS, BLUR]);
  });

  it("radial focuses a whole ring series", () => {
    const c = chart(radial());
    expect(resolveRepairAdapter(c, 1)?.family).toBe("radial");
    focusMark(c, { seriesIndex: 1 }, "pointer");
    flushFrames();
    expect(states(c, 1)[1]).toBe(EMPHASIS);
    expect(states(c, 0)[0]).toBe(BLUR);
    expect(states(c, 2)[2]).toBe(BLUR);
  });

  it("native families: pointer is a no-op, keyboard tips first then highlights", () => {
    const c = chart({
      xAxis: { type: "category", data: ["a", "b"] },
      yAxis: { type: "value" },
      series: [{ type: "bar", emphasis: { focus: "self" }, data: [1, 2] }],
    });
    expect(resolveRepairAdapter(c, 0)).toBeNull();
    const spy = vi.spyOn(c, "dispatchAction");
    focusMark(c, { seriesIndex: 0, dataIndex: 1 }, "pointer");
    expect(spy).not.toHaveBeenCalled();
    focusMark(c, { seriesIndex: 0, dataIndex: 1 }, "keyboard");
    expect(spy.mock.calls.map(([a]) => (a as { type: string }).type)).toEqual(["showTip", "downplay", "highlight"]);
  });
});

describe("one scheduler with a pending guard", () => {
  it("clearFocus cancels a late scatter repair — no re-blur after leaving", () => {
    const c = chart(scatter());
    const path = (el: unknown) => (el as { childAt(i: number): unknown }).childAt(0);
    focusMark(c, { seriesIndex: 0, dataIndex: 0 }, "pointer");
    expect(hasPendingRepair(c)).toBe(true);
    clearFocus(c, "pointer"); // globalout before the double rAF fired
    expect(hasPendingRepair(c)).toBe(false);
    flushFrames();
    expect(states(c, 0, path)).toEqual([NORMAL, NORMAL, NORMAL]);
  });

  it("coalesces hovers — the latest target wins", async () => {
    const c = chart(pie());
    const adapter = resolveRepairAdapter(c, 0)!;
    scheduleHoverFocusRepair(c, adapter, { seriesIndex: 0, dataIndex: 0 });
    scheduleHoverFocusRepair(c, adapter, { seriesIndex: 0, dataIndex: 3 });
    await tick();
    expect(states(c, 0)).toEqual([BLUR, BLUR, BLUR, NORMAL]);
  });

  it("clearFocus resets repair blur", async () => {
    const c = chart(pie());
    focusMark(c, { seriesIndex: 0, dataIndex: 0 }, "pointer");
    await tick();
    clearFocus(c, "pointer");
    expect(states(c, 0)).toEqual([NORMAL, NORMAL, NORMAL, NORMAL]);
  });
});

describe("hoverFocus={false}", () => {
  it("keyboard still shows the tip but never dims (repair or native)", async () => {
    const c = chart(pie());
    setHoverFocusEnabled(c, false);
    const spy = vi.spyOn(c, "dispatchAction");
    focusMark(c, { seriesIndex: 0, dataIndex: 1 }, "keyboard");
    await tick();
    expect(states(c, 0)).toEqual([NORMAL, NORMAL, NORMAL, NORMAL]);
    expect(spy.mock.calls.map(([a]) => (a as { type: string }).type)).toEqual(["showTip"]);
  });
});

describe("keyboard targets", () => {
  it("waterfall focuses the value bars, not the silent placeholder", () => {
    const c = chart(waterfall());
    expect(waterfallValuesSeriesIndex(c)).toBe(1);
    const target = resolveKeyboardTarget(c, "cartesian", { category: 2, series: 0 }, waterfallValuesSeriesIndex);
    expect(target).toEqual({ seriesIndex: 1, dataIndex: 2 });
    expect(resolveKeyboardTarget(c, "cartesian", { category: 2, series: 0 })).toEqual({ seriesIndex: 0, dataIndex: 2 });
  });

  it("marks mode walks painted marks and skips internal series", () => {
    const c = chart(radial());
    expect(listFocusTargets(c)).toEqual([
      { seriesIndex: 0, dataIndex: 0 },
      { seriesIndex: 1, dataIndex: 1 },
      { seriesIndex: 2, dataIndex: 2 },
    ]);
    const w = chart(waterfall());
    expect(listFocusTargets(w).every((t) => t.seriesIndex === 1)).toBe(true);
  });

  it("marks mode Enter params look like a pointer click", () => {
    const c = chart({
      xAxis: { type: "category", data: ["a", "b"] },
      yAxis: { type: "category", data: ["x"] },
      visualMap: { min: 0, max: 10, show: false },
      series: [{ type: "heatmap", id: "load", data: [[0, 0, 3], [1, 0, 7]] }],
    });
    const [first] = listFocusTargets(c);
    expect(markParamsAt(c, first!)).toMatchObject({
      componentType: "series",
      seriesType: "heatmap",
      seriesId: "load",
      seriesIndex: 0,
      dataIndex: 0,
    });
  });
});
