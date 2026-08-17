import { describe, expect, it } from "vitest";
import { compileAreaOption } from "../compile-area";
import { compilePieOption } from "../compile-pie";
import { compileRadialOption } from "../compile-radial";
import type { AreaSeriesPart, PieSeriesPart, RadialBarPart } from "../parts/types";
import { makeCtx } from "./make-ctx";

type EmphasisSeries = {
  emphasis?: { focus?: string; disabled?: boolean };
  blur?: unknown;
};

const desktop: AreaSeriesPart = {
  type: "area",
  id: "area-desktop",
  dataKey: "desktop",
};

const piePart: PieSeriesPart = {
  type: "pie",
  id: "pie-1",
  dataKey: "value",
  nameKey: "name",
};

const radialBarPart: RadialBarPart = {
  type: "radialBar",
  id: "radial-1",
  dataKey: "visitors",
};

describe("hoverFocus opt-out", () => {
  it("index focus (area): omit keeps focus; false disables emphasis", () => {
    const on = compileAreaOption(
      makeCtx({
        parts: [desktop],
        xDataKey: "month",
        data: [{ month: "Jan", desktop: 10 }],
      }),
    );
    const off = compileAreaOption(
      makeCtx({
        parts: [desktop],
        xDataKey: "month",
        hoverFocus: false,
        data: [{ month: "Jan", desktop: 10 }],
      }),
    );
    const onSeries = (on.series as EmphasisSeries[])[0]!;
    const offSeries = (off.series as EmphasisSeries[])[0]!;
    expect(onSeries.emphasis?.focus).toBe("self");
    expect(onSeries.emphasis?.disabled).toBe(false);
    expect(offSeries.emphasis?.disabled).toBe(true);
    expect(offSeries.emphasis?.focus).toBeUndefined();
  });

  it("item focus (pie): on keeps native emphasis disabled (runtime repair)", () => {
    const on = compilePieOption(
      makeCtx({
        parts: [piePart],
        data: [
          { name: "alpha", value: 10 },
          { name: "beta", value: 20 },
        ],
      }),
    );
    const series = (on.series as EmphasisSeries[])[0]!;
    expect(series.emphasis?.disabled).toBe(true);
  });

  it("item focus (pie): false disables emphasis and drops focus", () => {
    const off = compilePieOption(
      makeCtx({
        parts: [piePart],
        hoverFocus: false,
        data: [
          { name: "alpha", value: 10 },
          { name: "beta", value: 20 },
        ],
      }),
    );
    const series = (off.series as EmphasisSeries[])[0]!;
    expect(series.emphasis?.disabled).toBe(true);
    expect(series.emphasis?.focus).toBeUndefined();
  });

  it("series focus (radial): false disables emphasis and drops focus", () => {
    const off = compileRadialOption(
      makeCtx({
        parts: [radialBarPart],
        nameKey: "browser",
        hoverFocus: false,
        data: [
          { browser: "chrome", visitors: 275 },
          { browser: "safari", visitors: 200 },
        ],
        radial: { radialVariant: "full" },
        config: {
          chrome: { label: "Chrome" },
          safari: { label: "Safari" },
        },
      }),
    );
    const series = off.series as Array<EmphasisSeries & { id?: string }>;
    const rings = series.filter((s) => s.id !== "__radial_track__");
    expect(rings.length).toBeGreaterThan(0);
    for (const ring of rings) {
      expect(ring.emphasis?.disabled).toBe(true);
      expect(ring.emphasis?.focus).toBeUndefined();
    }
  });
});
