import { describe, expect, it } from "vitest";
import { compileScatterOption } from "../compile-scatter";
import type { ScatterSeriesPart } from "../parts/types";
import { makeCtx } from "./make-ctx";

const desktopPart: ScatterSeriesPart = {
  type: "scatter",
  id: "scatter-desktop",
  dataKey: "desktop",
  points: [
    { x: 120, y: 260 },
    { x: 180, y: 420 },
  ],
};

const mobilePart: ScatterSeriesPart = {
  type: "scatter",
  id: "scatter-mobile",
  dataKey: "mobile",
  points: [
    { x: 140, y: 180 },
    { x: 210, y: 290 },
  ],
  variant: "bubble",
};

describe("compileScatterOption", () => {
  it("merges multiple scatter parts into one series with item focus", () => {
    const option = compileScatterOption(
      makeCtx({
        parts: [desktopPart, mobilePart],
        config: {
          desktop: { label: "Desktop" },
          mobile: { label: "Mobile" },
        },
      }),
    );

    const series = option.series as Array<{
      type?: string;
      stateAnimation?: { duration?: number };
      data?: Array<{
        name?: string;
        value?: [number, number];
        symbolSize?: number;
        itemStyle?: { color?: string };
        emphasis?: {
          focus?: string;
          blurScope?: string;
          itemStyle?: { opacity?: number; color?: string };
        };
        blur?: { itemStyle?: { opacity?: number } };
      }>;
    }>;

    expect(series).toHaveLength(1);
    expect(series[0]?.type).toBe("scatter");
    expect(series[0]?.stateAnimation?.duration).toBe(0);
    expect(series[0]?.data).toHaveLength(4);
    expect(series[0]?.data?.[0]).toMatchObject({
      name: "Desktop",
      value: [120, 260],
      symbolSize: 8,
      itemStyle: { color: "color(desktop,0)" },
      emphasis: {
        focus: "self",
        blurScope: "series",
        itemStyle: { opacity: 1, color: "color(desktop,0)" },
      },
      blur: { itemStyle: { opacity: 0.2 } },
    });
    expect(series[0]?.data?.[2]).toMatchObject({
      name: "Mobile",
      value: [140, 180],
      symbolSize: 14,
      itemStyle: { color: "color(mobile,0)" },
    });
  });

  it("adds per-point glow emphasis for glowing variants", () => {
    const option = compileScatterOption(
      makeCtx({
        parts: [{ ...desktopPart, variant: "glowing" }],
        config: { desktop: { label: "Desktop" } },
      }),
    );

    const series = (option.series as Array<{ data?: Array<{ emphasis?: { itemStyle?: { shadowBlur?: number } } }> }>)[0]!;
    expect(series.data?.[0]?.emphasis?.itemStyle?.shadowBlur).toBe(14);
  });
});
