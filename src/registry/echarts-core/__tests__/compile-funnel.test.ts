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
});
