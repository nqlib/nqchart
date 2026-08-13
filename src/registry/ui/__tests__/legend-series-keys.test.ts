import { describe, expect, it } from "vitest";
import { uniqueLegendSeriesKeys } from "../legend";

describe("uniqueLegendSeriesKeys", () => {
  it("keeps first occurrence when Area and Line share a dataKey", () => {
    expect(uniqueLegendSeriesKeys(["planned", "actual", "otd", "otd"])).toEqual([
      "planned",
      "actual",
      "otd",
    ]);
  });

  it("returns an empty list unchanged", () => {
    expect(uniqueLegendSeriesKeys([])).toEqual([]);
  });
});
