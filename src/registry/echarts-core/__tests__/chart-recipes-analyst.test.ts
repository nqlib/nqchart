import { describe, expect, it } from "vitest";
import {
  prepareCohortCells,
  prepareDumbbellRows,
  prepareForecastSeries,
  prepareVarianceRows,
} from "@/registry/lib/chart-recipes";
import { compileComposedOption } from "../compile-composed";
import { makeCtx } from "./make-ctx";

describe("prepareVarianceRows", () => {
  const opts = { categoryKey: "m", actualKey: "a", planKey: "p" };

  it("computes delta, deltaPct and good", () => {
    const rows = prepareVarianceRows(
      [
        { m: "Jan", a: 120, p: 100 },
        { m: "Feb", a: 90, p: 100 },
      ],
      opts,
    );
    expect(rows[0]).toEqual({ category: "Jan", actual: 120, plan: 100, delta: 20, deltaPct: 20, good: true });
    expect(rows[1]).toMatchObject({ delta: -10, deltaPct: -10, good: false });
  });

  it("inverts good for cost-like measures", () => {
    const [row] = prepareVarianceRows([{ m: "Jan", a: 90, p: 100 }], { ...opts, higherIsBetter: false });
    expect(row!.good).toBe(true);
  });

  it("plan 0 gives deltaPct null; missing plan gives null delta and good", () => {
    const rows = prepareVarianceRows(
      [
        { m: "Jan", a: 5, p: 0 },
        { m: "Feb", a: 5 },
      ],
      opts,
    );
    expect(rows[0]).toMatchObject({ delta: 5, deltaPct: null, good: true });
    expect(rows[1]).toMatchObject({ plan: null, delta: null, deltaPct: null, good: null });
  });

  it("divides by |plan| so a negative plan keeps the sign of delta", () => {
    const [row] = prepareVarianceRows([{ m: "Jan", a: -50, p: -100 }], opts);
    expect(row).toMatchObject({ delta: 50, deltaPct: 50, good: true });
  });
});

describe("prepareCohortCells", () => {
  const rows = [
    { c: "2026-02", p: 0, v: 200 },
    { c: "2026-02", p: 1, v: 100 },
    { c: "2026-01", p: 0, v: 100 },
    { c: "2026-01", p: 1, v: 80 },
    { c: "2026-01", p: 2, v: 50 },
  ];
  const opts = { cohortKey: "c", periodKey: "p", valueKey: "v" };

  it("builds a percent triangle with period 0 = 100 and no future cells", () => {
    const { cells, xLabels, yLabels } = prepareCohortCells(rows, { ...opts, mode: "percent" });
    expect(yLabels).toEqual(["2026-01", "2026-02"]);
    expect(xLabels).toEqual(["M0", "M1", "M2"]);
    expect(cells).toHaveLength(5);
    expect(cells.find((c) => c.row === "2026-01" && c.col === "M0")!.value).toBe(100);
    expect(cells.find((c) => c.row === "2026-02" && c.col === "M1")!.value).toBe(50);
    expect(cells.some((c) => c.row === "2026-02" && c.col === "M2")).toBe(false);
  });

  it("keeps raw values in absolute mode and reports min / max", () => {
    const { cells, min, max } = prepareCohortCells(rows, { ...opts, mode: "absolute" });
    expect(cells.find((c) => c.row === "2026-02" && c.col === "M0")!.value).toBe(200);
    expect([min, max]).toEqual([50, 200]);
  });

  it("indexes cells by sorted cohort (y) and period (x)", () => {
    const { cells } = prepareCohortCells(rows, opts);
    expect(cells.find((c) => c.row === "2026-02" && c.col === "M1")).toMatchObject({ x: 1, y: 1 });
  });

  it("drops cohorts without a positive period 0 in percent mode", () => {
    const { yLabels } = prepareCohortCells([{ c: "A", p: 1, v: 5 }, ...rows], opts);
    expect(yLabels).toEqual(["2026-01", "2026-02"]);
  });

  it("returns empty output for no usable rows", () => {
    expect(prepareCohortCells([], opts)).toEqual({ cells: [], xLabels: [], yLabels: [], min: 0, max: 0 });
  });
});

describe("prepareForecastSeries", () => {
  const rows = [
    { d: "Jan", a: 10 },
    { d: "Feb", a: 12 },
    { d: "Mar", f: 14, lo: 12, hi: 16 },
    { d: "Apr", f: 15, lo: 12, hi: 19 },
  ];
  const opts = { dateKey: "d", actualKey: "a", forecastKey: "f", lowerKey: "lo", upperKey: "hi" };

  it("joins forecast to the last actual point and pinches the band there", () => {
    const out = prepareForecastSeries(rows, opts);
    expect(out.map((r) => r.actual)).toEqual([10, 12, null, null]);
    expect(out.map((r) => r.forecast)).toEqual([null, 12, 14, 15]);
    expect(out[1]).toMatchObject({ lower: 12, upper: 12, band: [12, 12] });
    expect(out[3]).toMatchObject({ lower: 12, upper: 19, band: [12, 19] });
    expect(out[0]!.band).toBeNull();
  });

  it("keeps original fields", () => {
    expect(prepareForecastSeries(rows, opts)[0]!.d).toBe("Jan");
  });

  it("with no actuals returns forecast rows only from the first row", () => {
    const out = prepareForecastSeries(rows.slice(2), opts);
    expect(out.map((r) => r.forecast)).toEqual([14, 15]);
    expect(out.every((r) => r.actual === null)).toBe(true);
  });

  it("a gap in forecast data yields null band, not zero", () => {
    const out = prepareForecastSeries([{ d: "A", a: 1 }, { d: "B", f: 2 }], opts);
    expect(out[1]).toMatchObject({ forecast: 2, lower: null, upper: null, band: null });
  });
});

describe("prepareDumbbellRows", () => {
  const opts = { categoryKey: "c", fromKey: "f", toKey: "t" };

  it("computes delta and direction, sorted by delta descending", () => {
    const out = prepareDumbbellRows(
      [
        { c: "A", f: 10, t: 8 },
        { c: "B", f: 10, t: 20 },
        { c: "C", f: 5, t: 5 },
      ],
      opts,
    );
    expect(out.map((r) => [r.category, r.delta, r.direction])).toEqual([
      ["B", 10, "up"],
      ["C", 0, "flat"],
      ["A", -2, "down"],
    ]);
  });

  it("keeps input order on ties", () => {
    const out = prepareDumbbellRows(
      [
        { c: "X", f: 1, t: 3 },
        { c: "Y", f: 2, t: 4 },
        { c: "Z", f: 0, t: 2 },
      ],
      opts,
    );
    expect(out.map((r) => r.category)).toEqual(["X", "Y", "Z"]);
  });

  it("skips rows missing a side", () => {
    expect(prepareDumbbellRows([{ c: "A", f: 1 }], opts)).toEqual([]);
  });
});

describe("composed connector + dots", () => {
  const ctx = makeCtx({
    data: [{ x: "A", from: 1, to: 3 }],
    parts: [
      { type: "xAxis", id: "x", dataKey: "x" },
      { type: "connector", id: "c", fromKey: "from", toKey: "to", dataKey: "connector" },
      { type: "line", id: "l", dataKey: "from", variant: "dots" },
    ],
  });

  it("emits a custom connector series and a round, line-less marker series", () => {
    const series = compileComposedOption(ctx).series as Array<Record<string, unknown>>;
    const connector = series.find((s) => s.id === "connector")!;
    expect(connector.type).toBe("custom");
    expect(connector.data).toEqual([[0, 1, 3]]);
    const dots = series.find((s) => s.id === "from")!;
    expect(dots).toMatchObject({ symbol: "circle", symbolSize: 6, showLine: false });
  });
});
