import { describe, expect, it } from "vitest";
import * as echarts from "echarts/core";
import { TreemapChart } from "echarts/charts";
import { SVGRenderer } from "echarts/renderers";
import { FOCUS } from "../emphasis-presets";
import { CHART_SIGNATURE } from "../chart-signature";
import { HOVER_REPAIR_ADAPTERS, repairHoverFocus } from "../hover-focus-repair";
import { applyChartAnimationToOption } from "../apply-chart-animation";
import { compileTreemapOption } from "../compile-treemap";
import type { TreemapNode } from "../parts/types";
import { makeCtx } from "./make-ctx";

// Shape of a treemap node AFTER compilation — the compiler injects itemStyle
// onto each node, which the source TreemapNode (input shape) does not carry.
type CompiledTreemapNode = {
  itemStyle?: { borderWidth?: number; color?: string };
  children?: CompiledTreemapNode[];
};

const TREE: TreemapNode[] = [
  {
    name: "Engineering",
    children: [
      { name: "Frontend", value: 420 },
      { name: "Backend", value: 380 },
    ],
  },
];

describe("compileTreemapOption", () => {
  it("uses the FOCUS fade, instant geometry and item focus", () => {
    const option = compileTreemapOption(
      makeCtx({
        parts: [{ type: "treemap", id: "treemap-1", dataKey: "value", tree: TREE }],
        config: {
          Frontend: { label: "Frontend" },
          Backend: { label: "Backend" },
        },
      }),
    );

    const series = (
      option.series as Array<{
        type?: string;
        sort?: boolean;
        stateAnimation?: { duration?: number };
        animationDurationUpdate?: number;
        emphasis?: { focus?: string; blurScope?: string; disabled?: boolean };
        blur?: { itemStyle?: { opacity?: number }; label?: { opacity?: number } };
        levels?: Array<{ colorSaturation?: unknown; colorAlpha?: unknown }>;
        data?: Array<CompiledTreemapNode>;
      }>
    )[0]!;

    expect(series.type).toBe("treemap");
    expect(series.sort).toBe(false);
    expect(series.stateAnimation?.duration).toBe(FOCUS.durationMs);
    expect(series.animationDurationUpdate).toBe(0);
    expect(series.emphasis?.focus).toBe("self");
    expect(series.emphasis?.disabled).toBe(true);
    expect(series.blur?.itemStyle?.opacity).toBe(0.2);
    expect(series.blur?.label?.opacity).toBe(0.2);
    expect(series.levels?.[1]?.colorSaturation).toBeUndefined();
    expect(series.data?.[0]?.children?.[0]?.itemStyle?.borderWidth).toBeUndefined();
    expect(series.data?.[0]?.children?.[0]?.itemStyle?.color).toBe("color(Frontend,0)");
  });

  it("keeps animationDurationUpdate at 0 after applyChartAnimationToOption", () => {
    const option = compileTreemapOption(
      makeCtx({
        parts: [{ type: "treemap", id: "treemap-1", dataKey: "value", tree: TREE }],
      }),
    );
    const animated = applyChartAnimationToOption(option);
    const series = (animated.series as Array<{ animationDurationUpdate?: number }>)[0]!;
    expect(series.animationDurationUpdate).toBe(0);
  });

  it("separates tiles by one real seam at every level, with no painted border", () => {
    const option = compileTreemapOption(
      makeCtx({ parts: [{ type: "treemap", id: "treemap-1", dataKey: "value", tree: TREE }] }),
    );
    const series = (option.series as Array<{
      itemStyle?: { borderWidth?: number; gapWidth?: number; borderRadius?: number };
      levels?: Array<{ itemStyle?: { borderWidth?: number; gapWidth?: number } }>;
    }>)[0]!;
    const seam = CHART_SIGNATURE.gap.seam;
    expect(series.itemStyle?.gapWidth).toBe(seam);
    expect(series.itemStyle?.borderWidth).toBe(0);
    expect(series.itemStyle?.borderRadius).toBe(CHART_SIGNATURE.radius.mark);
    for (const level of series.levels ?? []) {
      expect(level.itemStyle?.gapWidth).toBe(seam);
      expect(level.itemStyle?.borderWidth).toBe(0);
    }
  });

  // ECharts' treemap state-style mapper drops `opacity`, so a blurred tile rect
  // ignores `blur.itemStyle.opacity` (0.2) and falls back to ECharts' default blur
  // of 0.1 on both the bg and content rects. Compile cannot reach it; the fix
  // belongs in the treemap repair adapter (pin the blur opacity on each rect).
  // Fixed by `pinTreemapBlurOpacity` (treemap adapter `prepareBlur`).
  it("every dimmed tile rect resolves to FOCUS.dim (0.2), not ECharts' default 0.1", () => {
    echarts.use([TreemapChart, SVGRenderer]);
    const option = compileTreemapOption(
      makeCtx({ parts: [{ type: "treemap", id: "treemap-1", dataKey: "value", tree: TREE }] }),
    );
    const { tooltip: _tooltip, ...rest } = option;
    void _tooltip;
    const chart = echarts.init(null, undefined, { renderer: "svg", ssr: true, width: 400, height: 300 });
    try {
      chart.setOption({ ...rest, animation: false });
      const adapter = HOVER_REPAIR_ADAPTERS.find((a) => a.family === "treemap")!;
      repairHoverFocus(chart, adapter, { seriesIndex: 0, dataIndex: 2 });
      type El = {
        hoverState?: number;
        stateProxy?: (name: string) => { style?: { opacity?: number } };
        childrenRef?: () => El[];
      };
      const data = (chart as unknown as {
        getModel(): { getSeriesByIndex(i: number): { getData(): { count(): number; getItemGraphicEl(i: number): El } } };
      })
        .getModel()
        .getSeriesByIndex(0)
        .getData();
      const rects: El[] = [];
      const collect = (el: El) => {
        if (el.stateProxy) rects.push(el);
        el.childrenRef?.().forEach(collect);
      };
      for (let i = 0; i < data.count(); i++) {
        const el = data.getItemGraphicEl(i);
        if (el.hoverState === 1) collect(el);
      }
      expect(rects.length).toBeGreaterThan(0);
      for (const rect of rects) {
        expect(rect.stateProxy!("blur").style?.opacity).toBe(FOCUS.dim);
      }
    } finally {
      chart.dispose();
    }
  });
});
