import { describe, expect, it } from "vitest";
import { compilePieOption } from "../compile-pie";
import type { PieSeriesPart } from "../parts/types";
import { makeCtx } from "./make-ctx";

const piePart: PieSeriesPart = {
  type: "pie",
  id: "pie-1",
  dataKey: "value",
  nameKey: "name",
};

describe("compilePieOption", () => {
  it("returns a series array for empty data without throwing", () => {
    const option = compilePieOption(makeCtx({ parts: [piePart] }));
    expect(option.series).toBeDefined();
    expect(Array.isArray(option.series)).toBe(true);
    expect((option.series as unknown[]).length).toBeGreaterThan(0);
  });

  it("maps names, values, and colors from a 3-row dataset", () => {
    const option = compilePieOption(
      makeCtx({
        parts: [piePart],
        data: [
          { name: "alpha", value: 10 },
          { name: "beta", value: 20 },
          { name: "gamma", value: 30 },
        ],
      }),
    );

    const series = (option.series as Array<{ data: Array<{ name: string; value: number; itemStyle: { color: string } }> }>)[0]!;
    expect(series.data).toHaveLength(3);
    expect(series.data[0]).toMatchObject({ name: "alpha", value: 10, itemStyle: { color: "color(alpha,0)" } });
    expect(series.data[1]).toMatchObject({ name: "beta", value: 20 });
    expect(series.data[2]).toMatchObject({ name: "gamma", value: 30 });
  });

  it("uses config label override for slice names", () => {
    const option = compilePieOption(
      makeCtx({
        parts: [piePart],
        config: { alpha: { label: "Alpha Co" } },
        data: [{ name: "alpha", value: 5 }],
      }),
    );

    const series = (option.series as Array<{ data: Array<{ name: string }> }>)[0]!;
    expect(series.data[0]?.name).toBe("Alpha Co");
  });

  it("matches snapshot for a representative context", () => {
    const option = compilePieOption(
      makeCtx({
        parts: [piePart],
        data: [
          { name: "a", value: 1 },
          { name: "b", value: 2 },
        ],
        config: { a: { label: "Slice A" } },
      }),
    );
    expect(option).toMatchSnapshot();
  });
});
