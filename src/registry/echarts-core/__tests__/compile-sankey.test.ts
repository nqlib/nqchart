import { describe, expect, it } from "vitest";
import * as echarts from "echarts/core";
import { SankeyChart } from "echarts/charts";
import { SVGRenderer } from "echarts/renderers";
import { CHART_SIGNATURE } from "../chart-signature";
import { FOCUS } from "../emphasis-presets";
import { NQ_DATUM, NQ_SERIES_KEY } from "../nq-mark-event";
import {
  SANKEY_LINK_OPACITY,
  SANKEY_NODE_WIDTH,
  compileSankeyOption,
  deriveSankeyGraph,
  sankeyNodeCorners,
} from "../compile-sankey";
import type { ChartPart, CompileContext, SankeyPart } from "../parts/types";
import { makeCtx } from "./make-ctx";

const LINKS = [
  { source: "Search", target: "Landing", value: 600 },
  { source: "Social", target: "Landing", value: 400 },
  { source: "Landing", target: "Signup", value: 700 },
  { source: "Landing", target: "Bounce", value: 300 },
  { source: "Signup", target: "Paid", value: 250 },
];

type SankeySeries = {
  type?: string;
  orient?: string;
  nodeAlign?: string;
  nodeWidth?: number;
  nodeGap?: number;
  draggable?: boolean;
  itemStyle?: { borderRadius?: number; borderWidth?: number };
  lineStyle?: { color?: string; opacity?: number };
  label?: { show?: boolean; formatter?: (p: unknown) => string };
  emphasis?: {
    focus?: string;
    disabled?: boolean;
    lineStyle?: { opacity?: number; color?: string };
    label?: { show?: boolean };
  };
  blur?: {
    itemStyle?: { opacity?: number };
    lineStyle?: { opacity?: number };
    label?: { opacity?: number };
  };
  stateAnimation?: { duration?: number };
  animationDurationUpdate?: number;
  data?: Array<{
    name: string;
    value: number;
    itemStyle?: { color?: string };
    emphasis?: { itemStyle?: { color?: string } };
    label?: { position?: string };
    [key: string]: unknown;
  }>;
  links?: Array<{ source: string; target: string; value: number; [key: string]: unknown }>;
};

function sankeyCtx(part: Partial<SankeyPart> = {}, extra: Partial<CompileContext> = {}) {
  const parts: ChartPart[] = [{ type: "sankey", id: "sankey", ...part }, ...(extra.parts ?? [])];
  return makeCtx({ data: LINKS, ...extra, parts });
}

function seriesOf(ctx: CompileContext): SankeySeries {
  return (compileSankeyOption(ctx).series as SankeySeries[])[0]!;
}

describe("deriveSankeyGraph", () => {
  it("derives nodes in first-appearance order with throughput", () => {
    const graph = deriveSankeyGraph(LINKS);
    expect(graph.nodes.map((n) => n.name)).toEqual([
      "Search",
      "Landing",
      "Social",
      "Signup",
      "Bounce",
      "Paid",
    ]);
    const landing = graph.nodes.find((n) => n.name === "Landing")!;
    expect(landing.inflow).toBe(1000);
    expect(landing.outflow).toBe(1000);
    expect(landing.value).toBe(1000);
    expect(graph.nodes.find((n) => n.name === "Signup")!.value).toBe(700);
  });

  it("keeps explicit nodes first and honours custom keys", () => {
    const graph = deriveSankeyGraph(
      [{ from: "a", to: "b", n: 3 }],
      { sourceKey: "from", targetKey: "to", valueKey: "n", nodes: [{ name: "b", tier: 2 }] },
    );
    expect(graph.nodes.map((n) => n.name)).toEqual(["b", "a"]);
    expect(graph.nodes[0]!.datum).toEqual({ name: "b", tier: 2 });
    expect(graph.links).toHaveLength(1);
    expect(graph.links[0]!.value).toBe(3);
  });

  it("drops self-loops, cycles, empty ends and non-positive values", () => {
    const graph = deriveSankeyGraph([
      { source: "a", target: "b", value: 1 },
      { source: "b", target: "a", value: 1 },
      { source: "c", target: "c", value: 1 },
      { source: "a", target: "", value: 1 },
      { source: "a", target: "d", value: 0 },
    ]);
    expect(graph.links.map((l) => `${l.source}>${l.target}`)).toEqual(["a>b"]);
  });

  it("places columns by nodeAlign", () => {
    const rows = [
      { source: "a", target: "b", value: 1 },
      { source: "b", target: "c", value: 1 },
      { source: "a", target: "x", value: 1 },
    ];
    const col = (align: "justify" | "left" | "right") =>
      Object.fromEntries(deriveSankeyGraph(rows, { nodeAlign: align }).nodes.map((n) => [n.name, n.column]));
    expect(col("justify")).toEqual({ a: 0, b: 1, c: 2, x: 2 });
    expect(col("left")).toEqual({ a: 0, b: 1, c: 2, x: 1 });
    expect(col("right")).toEqual({ a: 0, b: 1, c: 2, x: 2 });
  });
});

describe("compileSankeyOption", () => {
  it("compiles nodes and links with signature node shape", () => {
    const s = seriesOf(sankeyCtx());
    expect(s.type).toBe("sankey");
    expect(s.orient).toBe("horizontal");
    expect(s.nodeAlign).toBe("justify");
    expect(s.nodeWidth).toBe(SANKEY_NODE_WIDTH);
    expect(s.nodeGap).toBe(CHART_SIGNATURE.gap.stage);
    expect(s.draggable).toBe(false);
    // Corners are per node (only the link-free sides round); none at series level.
    expect(s.itemStyle?.borderRadius).toBeUndefined();
    expect(s.itemStyle?.borderWidth).toBe(0);
    const r = CHART_SIGNATURE.radius.mark;
    const corners = (name: string) =>
      (s.data?.find((n) => n.name === name) as { itemStyle?: { borderRadius?: number[] } } | undefined)
        ?.itemStyle?.borderRadius;
    expect(corners("Search")).toEqual([r, 0, 0, r]);
    expect(corners("Landing")).toEqual([0, 0, 0, 0]);
    expect(corners("Paid")).toEqual([0, r, r, 0]);
    expect(s.data).toHaveLength(6);
    expect(s.links).toHaveLength(5);
    expect(s.links?.[0]?.[NQ_SERIES_KEY]).toBe("Search");
    expect(s.links?.[0]?.[NQ_DATUM]).toEqual(LINKS[0]);
    expect(s.data?.[1]?.[NQ_DATUM]).toEqual({ name: "Landing", value: 1000 });
  });

  it("colors nodes from config, falls back to the palette, links by source", () => {
    const s = seriesOf(
      sankeyCtx({}, { config: { Search: { label: "Search" }, Landing: { label: "Landing" } } }),
    );
    const color = (name: string) => s.data?.find((n) => n.name === name)?.itemStyle?.color;
    expect(color("Search")).toBe("color(Search,0)");
    expect(color("Landing")).toBe("color(Landing,0)");
    // Config-less nodes cycle the palette, each a distinct slot.
    const fallback = ["Social", "Signup", "Bounce", "Paid"].map(color);
    expect(new Set(fallback).size).toBe(4);
    expect(fallback.every((c) => typeof c === "string" && !c.startsWith("color("))).toBe(true);
    // Emphasis restates the fill, so hover never lifts the colour.
    expect(s.data?.[0]?.emphasis?.itemStyle?.color).toBe("color(Search,0)");
    expect(s.lineStyle?.color).toBe("source");
    expect(s.lineStyle?.opacity).toBe(SANKEY_LINK_OPACITY);
    expect(seriesOf(sankeyCtx({ linkColor: "gradient" })).lineStyle?.color).toBe("gradient");
  });

  it("uses adjacency focus with the FOCUS dim and timing", () => {
    const s = seriesOf(sankeyCtx());
    expect(s.emphasis?.focus).toBe("adjacency");
    expect(s.emphasis?.disabled).toBe(false);
    expect(s.emphasis?.lineStyle?.opacity).toBe(SANKEY_LINK_OPACITY);
    expect(s.emphasis?.lineStyle?.color).toBe("source");
    expect(s.blur?.itemStyle?.opacity).toBe(FOCUS.dim);
    expect(s.blur?.label?.opacity).toBe(FOCUS.dim);
    expect(s.blur?.lineStyle?.opacity).toBeCloseTo(SANKEY_LINK_OPACITY * FOCUS.dim);
    expect(s.stateAnimation?.duration).toBe(FOCUS.durationMs);
    expect(s.animationDurationUpdate).toBe(0);
  });

  it("hoverFocus={false} disables emphasis and drops the blur", () => {
    const s = seriesOf(makeCtx({ data: LINKS, parts: [{ type: "sankey", id: "s" }], hoverFocus: false }));
    expect(s.emphasis?.disabled).toBe(true);
    expect(s.emphasis?.focus).toBeUndefined();
    expect(s.blur).toBeUndefined();
  });

  it("labels show name + formatted value, inward in the last column", () => {
    const s = seriesOf(
      sankeyCtx({ formatValue: (v) => `$${v}` }, { config: { Landing: { label: "Landing page" } } }),
    );
    expect(s.label?.show).toBe(true);
    expect(s.label?.formatter?.({ name: "Landing", value: 1000 })).toBe(
      "{name|Landing page} {value|$1000}",
    );
    const pos = (name: string) => s.data?.find((n) => n.name === name)?.label?.position;
    expect(pos("Search")).toBe("right");
    expect(pos("Paid")).toBe("left");
    expect(pos("Bounce")).toBe("left");

    const hidden = seriesOf(sankeyCtx({ showLabels: false }));
    expect(hidden.label?.show).toBe(false);
    expect(hidden.emphasis?.label?.show).toBe(false);
  });

  it("orient vertical puts labels above, last row below", () => {
    const s = seriesOf(sankeyCtx({ orient: "vertical", nodeWidth: 4, nodeGap: 20 }));
    expect(s.orient).toBe("vertical");
    expect(s.nodeWidth).toBe(4);
    expect(s.nodeGap).toBe(20);
    // Radius clamps to half the node's thickness; vertical rounds the top of
    // a source and the bottom of a sink.
    const corners = (name: string) =>
      (s.data?.find((n) => n.name === name) as { itemStyle?: { borderRadius?: number[] } } | undefined)
        ?.itemStyle?.borderRadius;
    expect(corners("Search")).toEqual([2, 2, 0, 0]);
    expect(corners("Paid")).toEqual([0, 0, 2, 2]);
    const pos = (name: string) => s.data?.find((n) => n.name === name)?.label?.position;
    expect(pos("Search")).toBe("top");
    expect(pos("Paid")).toBe("bottom");
  });

  it("tooltip: node → throughput, link → source → target: value", () => {
    const native = compileSankeyOption(sankeyCtx({ formatValue: (v) => `${v} users` }));
    const fmt = (native.tooltip as { formatter: (p: unknown) => string }).formatter;
    expect(fmt({ dataType: "node", name: "Landing", value: 1000 })).toBe("Landing: 1000 users");
    expect(
      fmt({ dataType: "edge", data: { source: "Landing", target: "Signup", value: 700 } }),
    ).toBe("Landing → Signup: 700 users");

    const card = compileSankeyOption(
      sankeyCtx({}, { parts: [{ type: "tooltip", id: "tip" }] }),
    );
    const cardFmt = (card.tooltip as { formatter: (p: unknown) => string }).formatter;
    const html = cardFmt({ dataType: "edge", data: { source: "Landing", target: "Signup", value: 700 } });
    expect(html).toContain("nq-echarts-tooltip");
    expect(html).toContain("Landing → Signup");
    expect(html).toContain("700");
    expect(cardFmt({ dataType: "node", name: "Signup", value: 700 })).toContain("Signup");
  });

  it("renders in ECharts: node corners, adjacency keeps a node's links", () => {
    echarts.use([SankeyChart, SVGRenderer]);
    const option = compileSankeyOption(sankeyCtx());
    const { tooltip: _tooltip, ...rest } = option;
    void _tooltip;
    const chart = echarts.init(null, undefined, { renderer: "svg", ssr: true, width: 600, height: 300 });
    try {
      chart.setOption({ ...rest, animation: false });
      type El = { shape?: { r?: number | number[] }; hoverState?: number };
      const model = (chart as unknown as {
        getModel(): {
          getSeriesByIndex(i: number): {
            getData(type?: string): { count(): number; getItemGraphicEl(i: number): El };
          };
        };
      }).getModel().getSeriesByIndex(0);
      const nodeData = model.getData();
      const edgeData = model.getData("edge");
      // Node 0 (Search) is a source: rounded on the left, flush on the right.
      const r = CHART_SIGNATURE.radius.mark;
      expect(nodeData.getItemGraphicEl(0).shape?.r).toEqual([r, 0, 0, r]);

      // Hover "Signup" (node 3): its links Landing→Signup (2) and Signup→Paid (4) stay.
      chart.dispatchAction({ type: "highlight", seriesIndex: 0, dataIndex: 3 });
      // zrender hoverState: 1 = blur, 2 = emphasis.
      const blurred = (el: El) => el.hoverState === 1;
      expect(blurred(nodeData.getItemGraphicEl(3))).toBe(false);
      expect(blurred(nodeData.getItemGraphicEl(1))).toBe(false);
      expect(blurred(nodeData.getItemGraphicEl(5))).toBe(false);
      expect(blurred(nodeData.getItemGraphicEl(0))).toBe(true);
      expect(blurred(edgeData.getItemGraphicEl(2))).toBe(false);
      expect(blurred(edgeData.getItemGraphicEl(4))).toBe(false);
      expect(blurred(edgeData.getItemGraphicEl(0))).toBe(true);

      // Hover the link Landing→Signup (edge 2): it and its two nodes stay.
      chart.dispatchAction({ type: "downplay", seriesIndex: 0 });
      chart.dispatchAction({ type: "highlight", seriesIndex: 0, dataType: "edge", dataIndex: 2 });
      expect(blurred(edgeData.getItemGraphicEl(2))).toBe(false);
      expect(blurred(nodeData.getItemGraphicEl(1))).toBe(false);
      expect(blurred(nodeData.getItemGraphicEl(3))).toBe(false);
      expect(blurred(nodeData.getItemGraphicEl(5))).toBe(true);
      expect(blurred(edgeData.getItemGraphicEl(4))).toBe(true);
    } finally {
      chart.dispose();
    }
  });
});

describe("sankeyNodeCorners", () => {
  it("rounds only the sides with no links, so bands meet nodes flush", () => {
    // [tl, tr, br, bl]
    expect(sankeyNodeCorners("horizontal", 6, false, true)).toEqual([6, 0, 0, 6]);
    expect(sankeyNodeCorners("horizontal", 6, true, false)).toEqual([0, 6, 6, 0]);
    expect(sankeyNodeCorners("horizontal", 6, true, true)).toEqual([0, 0, 0, 0]);
    expect(sankeyNodeCorners("vertical", 6, false, true)).toEqual([6, 6, 0, 0]);
    expect(sankeyNodeCorners("vertical", 6, true, false)).toEqual([0, 0, 6, 6]);
  });

  it("applies per node: sources round left, sinks round right, pass-through nodes are square", () => {
    const option = compileSankeyOption(
      makeCtx({
        data: [
          { source: "a", target: "b", value: 2 },
          { source: "b", target: "c", value: 2 },
        ],
        parts: [{ type: "sankey", id: "s" }],
      }),
    );
    const series = (option.series as Array<{ data: Array<{ name: string; itemStyle: { borderRadius: number[] } }> }>)[0]!;
    const corners = Object.fromEntries(series.data.map((n) => [n.name, n.itemStyle.borderRadius]));
    expect(corners.a![1]).toBe(0);
    expect(corners.a![0]).toBeGreaterThan(0);
    expect(corners.b).toEqual([0, 0, 0, 0]);
    expect(corners.c![0]).toBe(0);
    expect(corners.c![1]).toBeGreaterThan(0);
  });
});
