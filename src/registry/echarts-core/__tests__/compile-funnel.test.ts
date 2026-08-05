import { describe, expect, it } from "vitest";
import { applyChartAnimationToOption } from "../apply-chart-animation";
import { compileFunnelOption } from "../compile-funnel";
import { makeCtx } from "./make-ctx";

describe("compileFunnelOption", () => {
  it("uses instant hover updates and disabled native emphasis", () => {
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
    expect(series.stateAnimation?.duration).toBe(0);
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
    expect(series.gap).toBe(12);
    expect(series.itemStyle?.borderWidth).toBe(2);
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
});
