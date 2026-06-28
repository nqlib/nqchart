import { describe, expect, it } from "vitest";
import { compileRadialOption } from "../compile-radial";
import type { GaugePart, RadialBarPart } from "../parts/types";
import { makeCtx } from "./make-ctx";

const radialBarPart: RadialBarPart = {
  type: "radialBar",
  id: "radial-1",
  dataKey: "visitors",
};

const gaugePart: GaugePart = {
  type: "gauge",
  id: "gauge-1",
  dataKey: "value",
  target: 80,
};

describe("compileRadialOption", () => {
  it("routes single-row data to gauge series", () => {
    const option = compileRadialOption(
      makeCtx({
        parts: [gaugePart],
        nameKey: "series",
        data: [{ series: "score", value: 72 }],
        radial: { radialVariant: "semi" },
      }),
    );

    const series = option.series as Array<{ type?: string; emphasis?: { disabled?: boolean } }>;
    expect(series[0]?.type).toBe("gauge");
    expect(series[0]?.emphasis?.disabled).toBe(true);
    expect(series[1]?.type).toBe("gauge");
  });

  it("models each ring as its own series with instant series focus", () => {
    const option = compileRadialOption(
      makeCtx({
        parts: [radialBarPart],
        nameKey: "browser",
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

    const series = option.series as Array<{
      type?: string;
      id?: string;
      emphasis?: { focus?: string; itemStyle?: { opacity?: number } };
      blur?: { itemStyle?: { opacity?: number } };
      stateAnimation?: { duration?: number };
    }>;

    const rings = series.filter((s) => s.id !== "__radial_track__");
    expect(rings).toHaveLength(2);
    for (const ring of rings) {
      expect(ring.type).toBe("bar");
      expect(ring.emphasis?.focus).toBe("series");
      expect(ring.emphasis?.itemStyle?.opacity).toBe(1);
      expect(ring.blur?.itemStyle?.opacity).toBe(0.2);
      expect(ring.stateAnimation?.duration).toBe(0);
    }
  });
});
