import { describe, expect, it } from "vitest";
import {
  computeSharedDomain,
  groupByFacet,
  inferValueKeys,
  niceDomain,
  smallMultiplesGridTemplate,
} from "../small-multiples";

const rows = [
  { region: "North", month: "Jan", revenue: 12, plan: 10 },
  { region: "South", month: "Jan", revenue: 31, plan: 28 },
  { region: "North", month: "Feb", revenue: 18, plan: 14 },
  { region: "South", month: "Feb", revenue: 47, plan: 30 },
  { region: "East", month: "Jan", revenue: 5, plan: 9 },
];

describe("groupByFacet", () => {
  it("groups in first-appearance order and keeps row order", () => {
    const groups = groupByFacet(rows, "region");
    expect(groups.map((g) => g.key)).toEqual(["North", "South", "East"]);
    expect(groups[0]!.rows.map((r) => r.month)).toEqual(["Jan", "Feb"]);
  });
  it("stringifies facet values and skips rows without one", () => {
    const data: { y?: number; v: number }[] = [{ y: 2024, v: 1 }, { y: 2025, v: 2 }, { v: 3 }];
    expect(groupByFacet(data, "y").map((g) => g.key)).toEqual(["2024", "2025"]);
  });
});

describe("inferValueKeys", () => {
  it("returns numeric fields except the facet key", () => {
    expect(inferValueKeys(rows, "region")).toEqual(["revenue", "plan"]);
  });
});

describe("computeSharedDomain", () => {
  it("spans every facet and anchors at zero by default", () => {
    expect(computeSharedDomain(rows, ["revenue", "plan"])).toEqual([0, 50]);
  });
  it("can leave zero out and skip nice rounding", () => {
    expect(computeSharedDomain(rows, ["revenue"], { includeZero: false, nice: false })).toEqual([
      5, 47,
    ]);
  });
  it("includes negatives", () => {
    expect(computeSharedDomain([{ v: -12 }, { v: 37 }], ["v"])).toEqual([-20, 40]);
  });
  it("ignores non-finite values and returns null when none remain", () => {
    expect(computeSharedDomain([{ v: Number.NaN }, { v: "x" }], ["v"])).toBeNull();
  });
});

describe("niceDomain", () => {
  it("rounds outward to a 1/2/2.5/5 step", () => {
    expect(niceDomain(0, 47)).toEqual([0, 50]);
    expect(niceDomain(0, 1234)).toEqual([0, 1250]);
    expect(niceDomain(0.1, 0.93)).toEqual([0, 1]);
  });
  it("pads a single value", () => {
    expect(niceDomain(0, 0)).toEqual([0, 1]);
    const [lo, hi] = niceDomain(100, 100);
    expect(lo).toBeLessThan(100);
    expect(hi).toBeGreaterThan(100);
  });
});

describe("smallMultiplesGridTemplate", () => {
  it("auto-fills min-width tracks with no columns", () => {
    expect(smallMultiplesGridTemplate(undefined, 220, "16px")).toBe(
      "repeat(auto-fill, minmax(min(100%, 220px), 1fr))",
    );
  });
  it("caps at `columns` and still wraps when narrow", () => {
    expect(smallMultiplesGridTemplate(3, 200, "16px")).toBe(
      "repeat(auto-fill, minmax(max(min(100%, 200px), calc((100% - 3 * 16px) / 3)), 1fr))",
    );
  });
});
