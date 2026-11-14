import { describe, expect, it } from "vitest";
import { extractCategoryBoundaryGap, indexToPlotPercent, withValueLabelRoom } from "../chart-grid";

describe("indexToPlotPercent", () => {
  it("anchors boundaryGap bands to start/end edges", () => {
    // 4 categories → bands at [0–25), [25–50), [50–75), [75–100]
    expect(indexToPlotPercent(0, 4, true, "start")).toBe(0);
    expect(indexToPlotPercent(0, 4, true, "end")).toBe(25);
    expect(indexToPlotPercent(0, 4, true, "center")).toBe(12.5);

    expect(indexToPlotPercent(3, 4, true, "start")).toBe(75);
    expect(indexToPlotPercent(3, 4, true, "end")).toBe(100);

    // Full inclusive range frames the plot edge-to-edge
    expect(indexToPlotPercent(0, 4, true, "start")).toBe(0);
    expect(indexToPlotPercent(3, 4, true, "end")).toBe(100);
  });

  it("collapses point axes (no boundaryGap) to category positions", () => {
    expect(indexToPlotPercent(0, 5, false, "start")).toBe(0);
    expect(indexToPlotPercent(2, 5, false, "end")).toBe(50);
    expect(indexToPlotPercent(4, 5, false, "center")).toBe(100);
  });

  it("handles a single category band", () => {
    expect(indexToPlotPercent(0, 1, true, "start")).toBe(0);
    expect(indexToPlotPercent(0, 1, true, "end")).toBe(100);
    expect(indexToPlotPercent(0, 1, true, "center")).toBe(50);
  });
});

describe("extractCategoryBoundaryGap", () => {
  it("defaults category xAxis to true", () => {
    expect(extractCategoryBoundaryGap({ xAxis: { type: "category" } })).toBe(true);
  });

  it("respects boundaryGap: false", () => {
    expect(
      extractCategoryBoundaryGap({ xAxis: { type: "category", boundaryGap: false } }),
    ).toBe(false);
  });
});

describe("withValueLabelRoom", () => {
  const grid = { left: 12, right: 12, top: 14, bottom: 4, containLabel: true };

  it("keeps the grid when no label shows", () => {
    expect(withValueLabelRoom(grid, [])).toBe(grid);
  });

  it("raises the top for column labels and the right for row labels", () => {
    expect(withValueLabelRoom(grid, ["+3"]).top).toBe(28);
    expect(withValueLabelRoom(grid, ["+3"]).right).toBe(12);
    const rows = withValueLabelRoom(grid, ["1,400", "9"], { horizontal: true });
    expect(rows.top).toBe(14);
    expect(rows.right).toBeGreaterThan(5 * 11 * 0.6);
  });

  it("gives edge points half a label of room on the right", () => {
    expect(withValueLabelRoom(grid, ["12,500"], { pointsOnEdge: true }).right).toBeGreaterThan(20);
  });

  it("never shrinks a wider edge", () => {
    expect(withValueLabelRoom({ ...grid, top: 40 }, ["1"]).top).toBe(40);
  });
});
