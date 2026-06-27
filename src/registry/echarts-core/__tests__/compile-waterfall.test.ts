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

    const series = option.series as Array<{ data: number[] }>;
    expect(series.length).toBeGreaterThanOrEqual(2);
    const values = series.find((s) => s.data.some((v) => v > 0));
    expect(values?.data).toBeDefined();
  });

  it("returns empty-ish option for empty data", () => {
    const option = compileWaterfallOption(makeCtx({ parts: [waterfallPart], data: [] }));
    expect(option.series).toBeDefined();
  });
});
