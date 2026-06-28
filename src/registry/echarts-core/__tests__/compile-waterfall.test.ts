import { describe, expect, it } from "vitest";
import { compileWaterfallOption } from "../compile-waterfall";
import type { WaterfallPart } from "../parts/types";
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
    expect(values?.stateAnimation?.duration).toBe(0);
    expect(values?.animationDurationUpdate).toBe(0);
    expect(values?.emphasis?.focus).toBe("self");
    expect(values?.emphasis?.disabled).toBe(true);
    expect(values?.blur?.itemStyle?.opacity).toBe(0.2);
  });

  it("returns empty-ish option for empty data", () => {
    const option = compileWaterfallOption(makeCtx({ parts: [waterfallPart], data: [] }));
    expect(option.series).toBeDefined();
  });
});
