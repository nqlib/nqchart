import { describe, expect, it } from "vitest";
import { compileLineOption } from "../compile-line";
import type { LineSeriesPart } from "../parts/types";
import { makeCtx } from "./make-ctx";

const salesLine: LineSeriesPart = {
  type: "line",
  id: "line-sales",
  dataKey: "sales",
};

describe("compileLineOption", () => {
  it("builds line series from data rows", () => {
    const option = compileLineOption(
      makeCtx({
        parts: [salesLine],
        xDataKey: "month",
        data: [
          { month: "Jan", sales: 10 },
          { month: "Feb", sales: 20 },
        ],
      }),
    );

    const series = option.series as Array<{ type: string; data: number[]; name: string }>;
    expect(series[0]?.type).toBe("line");
    expect(series[0]?.data).toEqual([10, 20]);
    expect(series[0]?.name).toBe("sales");
  });

  it("uses config label for series name", () => {
    const option = compileLineOption(
      makeCtx({
        parts: [salesLine],
        config: { sales: { label: "Revenue" } },
        xDataKey: "month",
        data: [{ month: "Jan", sales: 5 }],
      }),
    );

    const series = option.series as Array<{ name: string }>;
    expect(series[0]?.name).toBe("Revenue");
  });

  it("matches snapshot for a representative context", () => {
    const option = compileLineOption(
      makeCtx({
        parts: [salesLine],
        xDataKey: "month",
        data: [
          { month: "Q1", sales: 100 },
          { month: "Q2", sales: 150 },
        ],
      }),
    );
    expect(option).toMatchSnapshot();
  });
});
