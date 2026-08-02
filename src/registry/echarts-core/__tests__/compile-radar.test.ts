import { describe, expect, it } from "vitest";
import { compileRadarOption } from "../compile-radar";
import { makeCtx } from "./make-ctx";

const SKILLS = [
  { skill: "JavaScript", desktop: 90 },
  { skill: "Python", desktop: 75 },
  { skill: "CSS", desktop: 80 },
  { skill: "Node.js", desktop: 70 },
  { skill: "React", desktop: 85 },
  { skill: "TypeScript", desktop: 88 },
];

function radarOption() {
  return compileRadarOption(
    makeCtx({
      data: SKILLS,
      parts: [{ type: "radar", id: "radar-1", dataKey: "desktop", variant: "filled" }],
      config: { desktop: { label: "Desktop" } },
    }),
  ) as {
    radar: {
      radius?: string;
      center?: [string, string];
      axisName?: { color?: string; fontSize?: number };
    };
  };
}

describe("compileRadarOption", () => {
  // ECharts defaults the polar radius to 75% and draws axis names outside it
  // without reserving space, so names clip on short containers. Cartesian charts
  // avoid this via `containLabel`; polar has no equivalent.
  it("pulls the web in so axis names have room to render", () => {
    const { radar } = radarOption();

    expect(radar.radius).toBe("65%");
    expect(radar.center).toEqual(["50%", "50%"]);
  });

  it("themes axis names instead of leaving ECharts defaults", () => {
    const { radar } = radarOption();

    expect(radar.axisName?.color).toBeTruthy();
    expect(radar.axisName?.fontSize).toBeGreaterThan(0);
  });
});
