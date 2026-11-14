import { describe, expect, it } from "vitest";
import { FOCUS } from "../emphasis-presets";
import { applyChartAnimationToOption } from "../apply-chart-animation";
import { compileFunnelOption } from "../compile-funnel";
import { makeCtx } from "./make-ctx";

describe("compileFunnelOption", () => {
  it("uses the FOCUS fade, instant geometry and disabled native emphasis", () => {
    const option = compileFunnelOption(
      makeCtx({
        data: [
          { stage: "Visit", value: 100 },
          { stage: "Signup", value: 60 },
          { stage: "Purchase", value: 20 },
        ],
        config: {
          Visit: { label: "Visit" },
          Signup: { label: "Signup" },
          Purchase: { label: "Purchase" },
        },
        parts: [{ type: "funnel", id: "funnel-1", stageKey: "stage", valueKey: "value" }],
      }),
    );

    const series = (
      option.series as Array<{
        type?: string;
        stateAnimation?: { duration?: number };
        animationDurationUpdate?: number;
        emphasis?: { focus?: string; disabled?: boolean };
        blur?: { itemStyle?: { opacity?: number }; label?: { opacity?: number } };
      }>
    )[0]!;

    expect(series.type).toBe("funnel");
    expect(series.stateAnimation?.duration).toBe(FOCUS.durationMs);
    expect(series.animationDurationUpdate).toBe(0);
    expect(series.emphasis?.focus).toBe("self");
    expect(series.emphasis?.disabled).toBe(true);
    expect(series.blur?.itemStyle?.opacity).toBe(0.2);
    expect(series.blur?.label?.opacity).toBe(0.2);
  });

  it("keeps animationDurationUpdate at 0 after applyChartAnimationToOption", () => {
    const option = compileFunnelOption(
      makeCtx({
        data: [{ stage: "Visit", value: 100 }],
        parts: [{ type: "funnel", id: "funnel-1", stageKey: "stage", valueKey: "value" }],
      }),
    );
    const animated = applyChartAnimationToOption(option);
    const series = (animated.series as Array<{ animationDurationUpdate?: number }>)[0]!;
    expect(series.animationDurationUpdate).toBe(0);
  });

  // The stage border paints the chart *background*, so `gap` and `borderWidth`
  // compound into one visible seam. Both must be 0 or the funnel reads as
  // stacked blocks rather than a single tapering mark.
  const seamCtx = (style: Record<string, unknown>) =>
    makeCtx({
      data: [
        { stage: "Visitors", value: 10000 },
        { stage: "Signups", value: 5200 },
        { stage: "Paid", value: 1200 },
      ],
      nameKey: "stage",
      valueKey: "value",
      parts: [{ type: "funnelStyle", id: "style-1", ...style }],
      config: { Visitors: {}, Signups: {}, Paid: {} },
    });

  function seamOf(style: Record<string, unknown>) {
    const option = compileFunnelOption(seamCtx(style));
    return (
      option.series as Array<{ gap?: number; itemStyle?: { borderWidth?: number } }>
    )[0]!;
  }

  it("draws stages seamlessly by default", () => {
    const series = seamOf({});
    expect(series.gap).toBe(0);
    expect(series.itemStyle?.borderWidth).toBe(0);
  });

  it("still separates stages under the segmented preset", () => {
    const series = seamOf({ connection: "segmented" });
    expect(series.gap).toBe(8);
    expect(series.itemStyle?.borderWidth).toBe(0);
  });

  it("lets an explicit stageGap override the preset", () => {
    expect(seamOf({ stageGap: 8 }).gap).toBe(8);
  });

  it("passes orient=horizontal to the native funnel series", () => {
    const option = compileFunnelOption(
      makeCtx({
        data: [
          { stage: "Visit", value: 100 },
          { stage: "Signup", value: 60 },
        ],
        config: { Visit: {}, Signup: {} },
        parts: [
          { type: "funnel", id: "funnel-1", stageKey: "stage", valueKey: "value" },
          { type: "funnelStyle", id: "style-1", orient: "horizontal" },
        ],
      }),
    );
    const series = (option.series as Array<{ type?: string; orient?: string }>)[0]!;
    expect(series.type).toBe("funnel");
    expect(series.orient).toBe("horizontal");
  });

  it("defaults sort to none so stage order follows data, not values", () => {
    const option = compileFunnelOption(
      makeCtx({
        data: [
          { stage: "Opportunities", value: 10 },
          { stage: "On Deck", value: 40 },
          { stage: "Interview", value: 5 },
        ],
        config: { Opportunities: {}, "On Deck": {}, Interview: {} },
        parts: [{ type: "funnel", id: "funnel-1", stageKey: "stage", valueKey: "value" }],
      }),
    );
    const series = (
      option.series as Array<{
        sort?: string;
        data?: Array<{ name?: string; value?: number }>;
      }>
    )[0]!;
    expect(series.sort).toBe("none");
    expect(series.data?.map((d) => d.name)).toEqual([
      "Opportunities",
      "On Deck",
      "Interview",
    ]);
  });

  it("honors sort=descending when value ranking is desired", () => {
    const option = compileFunnelOption(
      makeCtx({
        data: [
          { stage: "Opportunities", value: 10 },
          { stage: "On Deck", value: 40 },
        ],
        config: { Opportunities: {}, "On Deck": {} },
        parts: [
          { type: "funnel", id: "funnel-1", stageKey: "stage", valueKey: "value" },
          { type: "funnelStyle", id: "style-1", sort: "descending" },
        ],
      }),
    );
    const series = (option.series as Array<{ sort?: string }>)[0]!;
    expect(series.sort).toBe("descending");
  });

  it("compiles a custom pipe series when connection=pipe", () => {
    const option = compileFunnelOption(
      makeCtx({
        data: [
          { stage: "Posted", value: 255 },
          { stage: "Engaged", value: 248 },
          { stage: "Hired", value: 55 },
        ],
        config: { Posted: {}, Engaged: {}, Hired: {} },
        parts: [
          { type: "funnel", id: "funnel-1", stageKey: "stage", valueKey: "value" },
          { type: "funnelStyle", id: "style-1", connection: "pipe", turnRadius: 12 },
        ],
      }),
    );
    const series = (
      option.series as Array<{ type?: string; id?: string; renderItem?: unknown }>
    )[0]!;
    expect(series.type).toBe("custom");
    expect(series.id).toBe("nq-funnel-pipe");
    expect(typeof series.renderItem).toBe("function");
    // Pipe defaults horizontal — still needs a cartesian scaffold.
    expect(option.grid).toBeTruthy();
  });

  it("honors orient=vertical for pipe connection", () => {
    const option = compileFunnelOption(
      makeCtx({
        data: [
          { stage: "Posted", value: 255 },
          { stage: "Hired", value: 55 },
        ],
        config: { Posted: {}, Hired: {} },
        parts: [
          { type: "funnel", id: "funnel-1", stageKey: "stage", valueKey: "value" },
          {
            type: "funnelStyle",
            id: "style-1",
            connection: "pipe",
            orient: "vertical",
          },
        ],
      }),
    );
    const series = (option.series as Array<{ type?: string; id?: string }>)[0]!;
    expect(series.type).toBe("custom");
    expect(series.id).toBe("nq-funnel-pipe");
  });

  it("right-aligns vertical pipe labels in a wide left band (no clip)", () => {
    const option = compileFunnelOption(
      makeCtx({
        data: [
          { stage: "Application", value: 234 },
          { stage: "Hired", value: 55 },
        ],
        config: {
          Application: { label: "Application" },
          Hired: { label: "Hired" },
        },
        parts: [
          { type: "funnel", id: "funnel-1", stageKey: "stage", valueKey: "value" },
          {
            type: "funnelStyle",
            id: "style-1",
            connection: "pipe",
            orient: "vertical",
            showLabels: true,
          },
        ],
      }),
    );
    type RenderChild = {
      type?: string;
      x?: number;
      y?: number;
      style?: { textAlign?: string; text?: string };
    };
    type RenderGroup = { type?: string; children?: RenderChild[] };
    const series = (
      option.series as Array<{
        renderItem?: (
          params: { dataIndex: number },
          api: {
            getWidth: () => number;
            getHeight: () => number;
            style: (s: Record<string, unknown>) => Record<string, unknown>;
          },
        ) => RenderGroup | undefined;
      }>
    )[0]!;
    const group = series.renderItem?.(
      { dataIndex: 0 },
      {
        getWidth: () => 320,
        getHeight: () => 280,
        style: (s) => s,
      },
    );
    const label = group?.children?.find((c) => c.type === "text");
    expect(label?.style?.textAlign).toBe("right");
    expect(label?.style?.text).toContain("Application");
    // Left band 100px, gap 8 → anchor near ribbon; text grows left into band.
    expect(label?.x).toBe(92);
    const path = group?.children?.find((c) => c.type === "path");
    expect(path?.x).toBe(100);
  });

  it("defaults to native sharp trapezoids (cornerRadius 0)", () => {
    const option = compileFunnelOption(
      makeCtx({
        data: [{ stage: "Visit", value: 100 }],
        config: { Visit: {} },
        parts: [{ type: "funnel", id: "funnel-1", stageKey: "stage", valueKey: "value" }],
      }),
    );
    const series = (
      option.series as Array<{
        type?: string;
        itemStyle?: { borderRadius?: number };
        data?: Array<{ itemStyle?: { borderRadius?: number } }>;
      }>
    )[0]!;
    expect(series.type).toBe("funnel");
    expect(series.itemStyle?.borderRadius).toBe(0);
    expect(series.data?.[0]?.itemStyle?.borderRadius).toBe(0);
  });

  it("compiles a custom rounded series when connection=rounded", () => {
    const option = compileFunnelOption(
      makeCtx({
        data: [
          { stage: "Quoted", value: 248_600 },
          { stage: "Approved", value: 96_400 },
          { stage: "Closed", value: 42_000 },
        ],
        config: { Quoted: {}, Approved: {}, Closed: {} },
        parts: [
          { type: "funnel", id: "funnel-1", stageKey: "stage", valueKey: "value" },
          {
            type: "funnelStyle",
            id: "style-1",
            connection: "rounded",
            cornerRadius: 14,
            stageGap: 10,
          },
        ],
      }),
    );
    const series = (
      option.series as Array<{
        type?: string;
        id?: string;
        data?: unknown[];
        renderItem?: (
          params: { dataIndex: number },
          api: {
            getWidth: () => number;
            getHeight: () => number;
            style: (s: unknown) => unknown;
          },
        ) => { type?: string; children?: Array<{ type?: string; shape?: { pathData?: string }; style?: { text?: string } }> } | undefined;
      }>
    )[0]!;
    expect(series.type).toBe("custom");
    expect(series.id).toBe("nq-funnel-rounded");
    expect(series.data).toHaveLength(3);

    const group = series.renderItem?.(
      { dataIndex: 0 },
      {
        getWidth: () => 320,
        getHeight: () => 280,
        style: (s) => s,
      },
    );
    const path = group?.children?.find((c) => c.type === "path");
    expect(path?.shape?.pathData).toContain(" C ");
    expect(path?.shape?.pathData?.endsWith("Z")).toBe(true);
    const label = group?.children?.find((c) => c.type === "text");
    expect(label?.style?.text).toContain("Quoted");
  });

  it("defaults rounded cornerRadius to the signature surface radius (11) when unset (curved trapezoid, sideCurve 0)", () => {
    const option = compileFunnelOption(
      makeCtx({
        data: [{ stage: "Visit", value: 100 }],
        config: { Visit: {} },
        parts: [
          { type: "funnel", id: "funnel-1", stageKey: "stage", valueKey: "value" },
          { type: "funnelStyle", id: "style-1", connection: "rounded" },
        ],
      }),
    );
    const series = (
      option.series as Array<{
        type?: string;
        id?: string;
        renderItem?: (
          params: { dataIndex: number },
          api: {
            getWidth: () => number;
            getHeight: () => number;
            style: (s: unknown) => unknown;
          },
        ) => { children?: Array<{ type?: string; shape?: { pathData?: string } }> } | undefined;
      }>
    )[0]!;
    expect(series.id).toBe("nq-funnel-rounded");
    const group = series.renderItem?.(
      { dataIndex: 0 },
      {
        getWidth: () => 200,
        getHeight: () => 160,
        style: (s) => s,
      },
    );
    const pathData = group?.children?.find((c) => c.type === "path")?.shape?.pathData;
    expect(pathData?.endsWith("Z")).toBe(true);
    expect(pathData).toContain(" C ");
  });

  it("plumbs innerCornerRadius to the corners facing a gap (default 3)", () => {
    type RoundedSeries = {
      renderItem?: (
        params: { dataIndex: number },
        api: { getWidth: () => number; getHeight: () => number; style: (s: unknown) => unknown },
      ) => { children?: Array<{ type?: string; shape?: { pathData?: string } }> } | undefined;
    };
    const middlePath = (style: Record<string, unknown>) => {
      const option = compileFunnelOption(
        makeCtx({
          data: [
            { stage: "A", value: 100 },
            { stage: "B", value: 60 },
            { stage: "C", value: 20 },
          ],
          config: { A: {}, B: {}, C: {} },
          parts: [
            { type: "funnel", id: "funnel-1", stageKey: "stage", valueKey: "value" },
            { type: "funnelStyle", id: "style-1", connection: "rounded", ...style },
          ],
        }),
      );
      const series = (option.series as RoundedSeries[])[0]!;
      return series.renderItem?.(
        { dataIndex: 1 },
        { getWidth: () => 320, getHeight: () => 280, style: (s) => s },
      )?.children?.find((c) => c.type === "path")?.shape?.pathData;
    };
    const byDefault = middlePath({});
    expect(middlePath({ innerCornerRadius: 3 })).toBe(byDefault);
    expect(middlePath({ innerCornerRadius: 14 })).not.toBe(byDefault);
  });

  it("uses custom soft path when native connection has cornerRadius > 0", () => {
    const option = compileFunnelOption(
      makeCtx({
        data: [
          { stage: "A", value: 100 },
          { stage: "B", value: 40 },
        ],
        config: { A: {}, B: {} },
        parts: [
          { type: "funnel", id: "funnel-1", stageKey: "stage", valueKey: "value" },
          {
            type: "funnelStyle",
            id: "style-1",
            connection: "default",
            cornerRadius: 12,
            sideCurve: 0,
          },
        ],
      }),
    );
    const series = (option.series as Array<{ type?: string; id?: string }>)[0]!;
    expect(series.type).toBe("custom");
    expect(series.id).toBe("nq-funnel-rounded");
  });

  it("keeps pipe mode when connection=pipe (not rounded)", () => {
    const option = compileFunnelOption(
      makeCtx({
        data: [
          { stage: "A", value: 10 },
          { stage: "B", value: 5 },
        ],
        config: { A: {}, B: {} },
        parts: [
          { type: "funnel", id: "funnel-1", stageKey: "stage", valueKey: "value" },
          { type: "funnelStyle", id: "style-1", connection: "pipe" },
        ],
      }),
    );
    const series = (option.series as Array<{ id?: string }>)[0]!;
    expect(series.id).toBe("nq-funnel-pipe");
  });

  it("formats inside labels with formatValue", () => {
    const option = compileFunnelOption(
      makeCtx({
        data: [{ stage: "Quoted", value: 248_600 }],
        config: { Quoted: {} },
        parts: [{ type: "funnel", id: "funnel-1", stageKey: "stage", valueKey: "value" }],
        funnel: {
          label: "value",
          formatValue: (v) => `$${v / 1000}K`,
        },
      }),
    );
    const series = (
      option.series as Array<{
        data?: Array<Record<string, unknown>>;
        label?: { formatter?: (params: { name?: string; data?: Record<string, unknown> }) => string };
      }>
    )[0]!;
    const text = series.label?.formatter?.({
      name: "Quoted",
      data: series.data?.[0],
    });
    expect(text).toBe("$248.6K");
  });

  it("hides native trapezoid labels when showLabels is false", () => {
    const option = compileFunnelOption(
      makeCtx({
        data: [{ stage: "Visit", value: 100 }],
        config: { Visit: {} },
        parts: [{ type: "funnel", id: "funnel-1", stageKey: "stage", valueKey: "value" }],
        funnel: { showLabels: false },
      }),
    );
    const series = (option.series as Array<{ label?: { show?: boolean } }>)[0]!;
    expect(series.label?.show).toBe(false);
  });

  it("sizes stages by sizeKey while labeling valueKey", () => {
    const option = compileFunnelOption(
      makeCtx({
        data: [
          { stage: "Early", value: 378_000, rank: 3 },
          { stage: "Qualified", value: 15_078, rank: 2 },
          { stage: "Negotiation", value: 250_789, rank: 1 },
        ],
        config: { Early: {}, Qualified: {}, Negotiation: {} },
        parts: [{ type: "funnel", id: "funnel-1", stageKey: "stage", valueKey: "value" }],
        funnel: { sizeKey: "rank", label: "value" },
      }),
    );
    const series = (
      option.series as Array<{
        data?: Array<{ value?: number; name?: string }>;
        label?: { formatter?: (params: { name?: string; data?: Record<string, unknown> }) => string };
      }>
    )[0]!;
    expect(series.data?.map((d) => d.value)).toEqual([3, 2, 1]);
    const text = series.label?.formatter?.({
      name: "Negotiation",
      data: series.data?.[2] as unknown as Record<string, unknown>,
    });
    expect(text).toBe("250789");
  });
});

describe("compileFunnelOption — cone", () => {
  type Child = {
    type?: string;
    silent?: boolean;
    z2?: number;
    blur?: unknown;
    shape?: { pathData?: string };
    style?: { fill?: unknown; stroke?: string; text?: string };
  };
  type ConeSeries = {
    id?: string;
    type?: string;
    renderItem?: (
      params: { dataIndex: number },
      api: { getWidth: () => number; getHeight: () => number },
    ) => { children?: Child[] } | undefined;
  };
  const api = { getWidth: () => 400, getHeight: () => 500 };

  function compileCone(style: Record<string, unknown> = {}, hoverFocus?: boolean) {
    const option = compileFunnelOption(
      makeCtx({
        data: [
          { stage: "A", value: 100 },
          { stage: "B", value: 40 },
          { stage: "C", value: 15 },
        ],
        config: { A: {}, B: {}, C: {} },
        hoverFocus,
        parts: [
          { type: "funnel", id: "funnel-1", stageKey: "stage", valueKey: "value" },
          { type: "funnelStyle", id: "style-1", connection: "cone", ...style },
        ],
      }),
    );
    return (option.series as ConeSeries[])[0]!;
  }

  it("compiles a cone custom series even when cornerRadius is set", () => {
    const series = compileCone({ cornerRadius: 12 });
    expect(series.type).toBe("custom");
    expect(series.id).toBe("nq-funnel-cone");
  });

  it("draws body + cap with shading overlays and a label per stage", () => {
    const group = compileCone().renderItem!({ dataIndex: 1 }, api)!;
    const paths = group.children!.filter((c) => c.type === "path");
    expect(paths).toHaveLength(4);
    expect(paths.some((p) => p.shape?.pathData?.includes(" A "))).toBe(true);
    // Overlays are silent so hover hits the colored shapes.
    expect(paths.filter((p) => p.silent)).toHaveLength(2);
    expect(group.children!.find((c) => c.type === "text")?.style?.text).toBe("B\n40");
  });

  it("stacks upper stages above lower ones", () => {
    const series = compileCone();
    const minZ = (i: number) =>
      Math.min(...series.renderItem!({ dataIndex: i }, api)!.children!.map((c) => c.z2 ?? 0));
    const maxZ = (i: number) =>
      Math.max(...series.renderItem!({ dataIndex: i }, api)!.children!.map((c) => c.z2 ?? 0));
    expect(minZ(0)).toBeGreaterThan(maxZ(1));
    expect(minZ(1)).toBeGreaterThan(maxZ(2));
  });

  it("hollow (default) rims only the first stage's opening; solid rims none", () => {
    const stroked = (series: ConeSeries, i: number) =>
      series.renderItem!({ dataIndex: i }, api)!.children!.some((c) => c.style?.stroke);
    const hollow = compileCone();
    expect(stroked(hollow, 0)).toBe(true);
    expect(stroked(hollow, 1)).toBe(false);
    const solid = compileCone({ coneStyle: "solid" });
    expect(stroked(solid, 0)).toBe(false);
  });

  it("dims children on blur only when hover focus is on", () => {
    const on = compileCone().renderItem!({ dataIndex: 0 }, api)!;
    expect(on.children!.every((c) => c.blur)).toBe(true);
    const off = compileCone({}, false).renderItem!({ dataIndex: 0 }, api)!;
    expect(off.children!.some((c) => c.blur)).toBe(false);
  });
});

describe("custom-series focus lives on the returned element", () => {
  type Group = { focus?: string; blurScope?: string; emphasisDisabled?: boolean; children?: Array<{ blur?: unknown }> };
  type Series = {
    renderItem?: (
      p: { dataIndex: number },
      api: { getWidth: () => number; getHeight: () => number; style: (s?: unknown) => unknown },
    ) => Group | undefined;
  };
  const api = { getWidth: () => 400, getHeight: () => 500, style: (s?: unknown) => s ?? {} };

  for (const connection of ["pipe", "rounded", "cone"] as const) {
    it(`${connection}: group carries focus/blurScope; every child carries a blur state`, () => {
      const compile = (hoverFocus?: boolean) =>
        (compileFunnelOption(
          makeCtx({
            data: [
              { stage: "A", value: 10 },
              { stage: "B", value: 5 },
            ],
            config: { A: {}, B: {} },
            hoverFocus,
            parts: [
              { type: "funnel", id: "f", stageKey: "stage", valueKey: "value" },
              { type: "funnelStyle", id: "s", connection },
            ],
          }),
        ).series as Series[])[0]!;
      const on = compile().renderItem!({ dataIndex: 0 }, api)!;
      expect(on.focus).toBe("self");
      expect(on.blurScope).toBe("series");
      expect(on.children!.every((c) => c.blur)).toBe(true);
      const off = compile(false).renderItem!({ dataIndex: 0 }, api)!;
      expect(off.emphasisDisabled).toBe(true);
      expect(off.children!.some((c) => c.blur)).toBe(false);
    });
  }
});
