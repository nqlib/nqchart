import { describe, expect, it } from "vitest";
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
  it("uses instant hover updates and item focus", () => {
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
    expect(series.stateAnimation?.duration).toBe(0);
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
});
