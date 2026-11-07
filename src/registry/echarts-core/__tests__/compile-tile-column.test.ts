import { describe, expect, it } from "vitest";
import { resolveCartesianGrid } from "../chart-grid";
import { CHART_SIGNATURE } from "../chart-signature";
import { compileTileColumnOption } from "../compile-tile-column";
import { makeCtx } from "./make-ctx";

describe("compileTileColumnOption", () => {
  it("emits a custom series with only filled tiles per column", () => {
    const option = compileTileColumnOption(
      makeCtx({
        config: {
          intensity: {
            label: "Intensity",
            colors: {
              light: ["#a", "#b", "#c", "#d"],
              dark: ["#a", "#b", "#c", "#d"],
            },
          },
        },
        parts: [
          {
            type: "tileColumn",
            id: "tiles-1",
            dataKey: "intensity",
            rows: [
              { date: "Oct 1", value: 4000 },
              { date: "Oct 2", value: 0 },
              { date: "Today", value: 2000 },
            ],
            bands: [0, 1000, 2000, 3000, 4000],
            cellRadius: 2,
            cellGap: 2,
          },
        ],
      }),
    );

    const series = (option.series as Array<{ type?: string; id?: string; data?: Array<{ tiles: number }> }>)[0]!;
    expect(series.type).toBe("custom");
    expect(series.id).toBe("intensity");
    expect(series.data?.map((d) => d.tiles)).toEqual([4, 0, 2]);

    const xAxis = option.xAxis as { data?: string[] };
    expect(xAxis.data).toEqual(["Oct 1", "Oct 2", "Today"]);
  });

  it("renders uniform square tiles (never stretched to band height)", () => {
    const option = compileTileColumnOption(
      makeCtx({
        config: { intensity: { label: "Intensity" } },
        parts: [
          {
            type: "tileColumn",
            id: "tiles-1",
            dataKey: "intensity",
            rows: [{ date: "Today", value: 3000 }],
            bands: [0, 1000, 2000, 3000, 4000],
            cellGap: 2,
            cellRadius: 2,
          },
        ],
      }),
    );
    const series = (
      option.series as Array<{
        renderItem?: (
          params: { dataIndex: number },
          api: {
            coord: (point: number[]) => number[];
            size?: (range: number[], point: number[]) => number[];
            style: (s: Record<string, unknown>) => Record<string, unknown>;
          },
        ) => { children?: Array<{ shape?: { width?: number; height?: number } }> };
      }>
    )[0]!;
    // Tall bands (40px) vs narrow columns (12px) — side must follow the lesser,
    // and each of the 3 filled bands packs 3 squares (pitch 40 / 3).
    const group = series.renderItem?.(
      { dataIndex: 0 },
      {
        coord: ([, y = 0]) => [50, 200 - y * 40],
        size: () => [12, 0],
        style: (s) => s,
      },
    );
    const shapes = group?.children ?? [];
    expect(shapes.length).toBe(9);
    for (const child of shapes) {
      expect(child.shape?.width).toBe(10);
      expect(child.shape?.height).toBe(10);
      expect(child.shape?.width).toBe(child.shape?.height);
    }
  });

  it("fills each band row so a column's top meets its y tick", () => {
    const option = compileTileColumnOption(
      makeCtx({
        config: { intensity: { label: "Intensity" } },
        parts: [
          {
            type: "tileColumn",
            id: "tiles-1",
            dataKey: "intensity",
            rows: [{ date: "Today", value: 3000 }],
            bands: [0, 1000, 2000, 3000, 4000],
            cellGap: 2,
            cellRadius: 2,
          },
        ],
      }),
    );
    const series = (
      option.series as Array<{
        renderItem?: (
          params: { dataIndex: number },
          api: {
            coord: (point: number[]) => number[];
            size?: (range: number[], point: number[]) => number[];
            style: (s: Record<string, unknown>) => Record<string, unknown>;
          },
        ) => { children?: Array<{ shape?: { y?: number; height?: number } }> };
      }>
    )[0]!;
    const BAND = 40;
    const FLOOR = 200;
    const tops = (columnWidth: number) =>
      (
        series.renderItem?.(
          { dataIndex: 0 },
          {
            coord: ([, y = 0]) => [50, FLOOR - y * BAND],
            size: () => [columnWidth, 0],
            style: (s) => s,
          },
        )?.children ?? []
      ).map((c) => c.shape!.y!);
    // Square bands: one tile per band, same geometry as a contiguous stack.
    expect(tops(40)).toEqual([FLOOR - BAND + 1, FLOOR - 2 * BAND + 1, FLOOR - 3 * BAND + 1]);
    // Narrow columns (tall bands): 3 squares per band; the top square of the
    // third band sits just under the 3000 tick, not near the floor.
    const narrow = tops(12);
    expect(narrow).toHaveLength(9);
    const pitch = BAND / 3;
    const topOfColumn = Math.min(...narrow);
    expect(topOfColumn).toBeCloseTo(FLOOR - 3 * BAND + (pitch - 10) / 2, 5);
    // Evenly pitched within a band.
    const firstBand = narrow.slice(0, 3);
    expect(firstBand[1]! - firstBand[0]!).toBeCloseTo(pitch, 5);
  });

  it("labels only the first and last x tick by default", () => {
    const option = compileTileColumnOption(
      makeCtx({
        config: { intensity: { label: "Intensity" } },
        parts: [
          {
            type: "tileColumn",
            id: "tiles-1",
            dataKey: "intensity",
            rows: [
              { date: "A", value: 10 },
              { date: "B", value: 20 },
              { date: "C", value: 30 },
            ],
            bandCount: 4,
          },
        ],
      }),
    );
    const xAxis = option.xAxis as {
      axisLabel?: { formatter?: (value: string, index: number) => string };
    };
    const fmt = xAxis.axisLabel!.formatter!;
    expect(fmt("A", 0)).toBe("A");
    expect(fmt("B", 1)).toBe("");
    expect(fmt("C", 2)).toBe("C");
  });

  it("defaults tile radius and gap to the signature and uses the shared grid", () => {
    const parts = [
      {
        type: "tileColumn" as const,
        id: "tiles-1",
        dataKey: "intensity",
        rows: [{ date: "A", value: 2 }],
        bands: [0, 1, 2],
      },
    ];
    const option = compileTileColumnOption(makeCtx({ parts }));
    expect(option.grid).toEqual(resolveCartesianGrid(parts, undefined, 4));

    const series = (option.series as Array<{
      renderItem: (p: unknown, api: unknown) => { children: Array<{ shape: { y: number; r: number } }> };
    }>)[0]!;
    const api = {
      coord: ([, v]: [number, number]) => [50, 100 - v * 20],
      size: () => [40, 20],
      style: () => ({}),
    };
    const { children } = series.renderItem({ dataIndex: 0 }, api);
    expect(children).toHaveLength(2);
    expect(children[0]!.shape.r).toBe(CHART_SIGNATURE.radius.mark);
    // Stacked tiles are one tile side + the signature seam apart.
    const side = 20 - CHART_SIGNATURE.gap.seam;
    expect(children[0]!.shape.y - children[1]!.shape.y).toBe(side + CHART_SIGNATURE.gap.seam);
  });
});
