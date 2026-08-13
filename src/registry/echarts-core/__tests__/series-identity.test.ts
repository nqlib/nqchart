import { describe, expect, it } from "vitest";
import {
  dataKeyFromSeriesId,
  seriesMatchesLegendKey,
  uniquifySeriesIds,
} from "../series-identity";

describe("dataKeyFromSeriesId", () => {
  it("returns a plain dataKey unchanged", () => {
    expect(dataKeyFromSeriesId("otd")).toBe("otd");
  });

  it("strips a collision suffix", () => {
    expect(dataKeyFromSeriesId("otd__nq_area")).toBe("otd");
    expect(dataKeyFromSeriesId("otd__nq_area2")).toBe("otd");
  });

  it("leaves hover-trace and waterfall ids alone", () => {
    expect(dataKeyFromSeriesId("nq-hover-trace-otd")).toBe("nq-hover-trace-otd");
    expect(dataKeyFromSeriesId("__wf_values__")).toBe("__wf_values__");
    expect(dataKeyFromSeriesId("__nq_reference__")).toBe("__nq_reference__");
  });
});

describe("uniquifySeriesIds", () => {
  it("keeps the first claim of a dataKey and suffixes later marks", () => {
    const out = uniquifySeriesIds([
      { type: "line", id: "otd" },
      { type: "line", id: "otd", areaStyle: { opacity: 0.2 } },
    ]);
    expect(out.map((s) => s.id)).toEqual(["otd", "otd__nq_area"]);
  });

  it("does not rewrite unique ids", () => {
    const out = uniquifySeriesIds([
      { type: "bar", id: "planned" },
      { type: "line", id: "otd" },
    ]);
    expect(out.map((s) => s.id)).toEqual(["planned", "otd"]);
  });
});

describe("seriesMatchesLegendKey", () => {
  it("treats a suffixed area id as the same legend key", () => {
    expect(seriesMatchesLegendKey("otd__nq_area", "On-time delivery", "otd")).toBe(true);
    expect(seriesMatchesLegendKey("otd", "On-time delivery", "otd")).toBe(true);
    expect(seriesMatchesLegendKey("planned", "Planned", "otd")).toBe(false);
  });
});
