import { describe, expect, it } from "vitest";
import {
  DEFAULT_CONE_TILT,
  MAX_CONE_TILT,
  buildConeFunnelLayout,
  coneStage,
  coneWallTangent,
  ellipsePath,
  type ConeEllipse,
} from "../funnel-cone-geometry";

type Pt = { x: number; y: number };

/** Ellipse normal at a point on it (gradient of the implicit equation). */
function normal(e: ConeEllipse, p: Pt): Pt {
  return { x: (p.x - e.cx) / (e.rx * e.rx), y: (p.y - e.cy) / (e.ry * e.ry) };
}
function onEllipse(e: ConeEllipse, p: Pt): number {
  return ((p.x - e.cx) / e.rx) ** 2 + ((p.y - e.cy) / e.ry) ** 2;
}
function cosBetween(a: Pt, b: Pt): number {
  return (a.x * b.x + a.y * b.y) / (Math.hypot(a.x, a.y) * Math.hypot(b.x, b.y));
}

describe("coneWallTangent", () => {
  it("is horizontal for a cylinder and tilts below the rim for a narrowing cone", () => {
    expect(coneWallTangent(100, 100, 0.2, 200).sin).toBe(0);
    const { sin, cos } = coneWallTangent(250, 115, 0.2, 200);
    expect(sin).toBeCloseTo((135 * 0.2) / 200, 10);
    expect(sin * sin + cos * cos).toBeCloseTo(1, 10);
  });

  it("clamps when the stage is too short for an outer tangent", () => {
    expect(coneWallTangent(250, 10, 0.5, 20).sin).toBeLessThan(1);
  });
});

describe("coneStage", () => {
  const cases = [
    { tw: 500, bw: 231, h: 180, tilt: 0.18 },
    { tw: 231, bw: 128, h: 180, tilt: 0.3 },
    { tw: 160, bw: 160, h: 120, tilt: 0.2 },
    { tw: 128, bw: 60, h: 90, tilt: 0.1 },
  ];

  it("puts each wall exactly on both rims and tangent to them", () => {
    for (const { tw, bw, h, tilt } of cases) {
      const s = coneStage(250, 40, h, tw, bw, tilt);
      const pairs: Array<[Pt, Pt]> = [
        [s.tangents.topRight, s.tangents.bottomRight],
        [s.tangents.topLeft, s.tangents.bottomLeft],
      ];
      for (const [top, bot] of pairs) {
        expect(onEllipse(s.cap, top)).toBeCloseTo(1, 8);
        expect(onEllipse(s.bottom, bot)).toBeCloseTo(1, 8);
        const wall = { x: bot.x - top.x, y: bot.y - top.y };
        // Wall direction is perpendicular to both ellipse normals.
        expect(Math.abs(cosBetween(wall, normal(s.cap, top)))).toBeLessThan(1e-8);
        expect(Math.abs(cosBetween(wall, normal(s.bottom, bot)))).toBeLessThan(1e-8);
      }
    }
  });

  it("keeps rim ellipse height / width equal to tilt on every rim", () => {
    const s = coneStage(250, 40, 180, 500, 231, 0.18);
    expect(s.cap.ry / s.cap.rx).toBeCloseTo(0.18, 10);
    expect(s.bottom.ry / s.bottom.rx).toBeCloseTo(0.18, 10);
  });

  it("emits arcs for the front rims and a full-ellipse cap", () => {
    const s = coneStage(250, 40, 180, 500, 231, 0.18);
    expect(s.bodyPath.match(/\bA\b/g)?.length).toBe(2);
    expect(s.capPath.match(/\bA\b/g)?.length).toBe(2);
    expect(s.bodyPath.endsWith("Z")).toBe(true);
  });

  it("degrades to lines when flat (tilt 0) and to a point at a zero-width tip", () => {
    const flat = coneStage(100, 0, 100, 200, 100, 0);
    expect(flat.bodyPath).not.toMatch(/\bA\b/);
    expect(flat.bodyPath).not.toMatch(/NaN|Infinity/);
    const tip = coneStage(100, 0, 100, 120, 0, 0.2);
    expect(tip.tangents.bottomLeft).toEqual(tip.tangents.bottomRight);
    expect(tip.bodyPath.match(/\bA\b/g)?.length).toBe(1);
  });

  it("centers the label on the front face", () => {
    const s = coneStage(250, 40, 180, 500, 231, 0.18);
    expect(s.labelCenter.x).toBe(250);
    expect(s.labelCenter.y).toBeCloseTo(
      (40 + s.cap.ry + 40 + 180 + s.bottom.ry) / 2,
      10,
    );
  });
});

describe("ellipsePath", () => {
  it("draws two half arcs through both horizontal extremes", () => {
    expect(ellipsePath({ cx: 50, cy: 20, rx: 40, ry: 8 })).toBe(
      "M 10 20 A 40 8 0 1 0 90 20 A 40 8 0 1 0 10 20 Z",
    );
  });
});

describe("buildConeFunnelLayout", () => {
  const stages = [{ value: 248_600 }, { value: 96_400 }, { value: 38_200 }];

  it("defaults tilt and clamps it", () => {
    expect(buildConeFunnelLayout(stages, { width: 400, height: 500 }).tilt).toBe(
      DEFAULT_CONE_TILT,
    );
    expect(buildConeFunnelLayout(stages, { width: 400, height: 500, tilt: 3 }).tilt).toBe(
      MAX_CONE_TILT,
    );
  });

  it("shares widths across each gap (bottom_i === top_{i+1})", () => {
    const layout = buildConeFunnelLayout(stages, { width: 400, height: 500, gap: 8 });
    for (let i = 0; i < layout.stageCount - 1; i++) {
      expect(layout.stages[i]!.bottom.rx).toBe(layout.stages[i + 1]!.cap.rx);
      expect(layout.stages[i]!.bottom.ry).toBe(layout.stages[i + 1]!.cap.ry);
    }
  });

  it("fits the back of the first rim and the front of the last rim in the box", () => {
    const height = 500;
    const layout = buildConeFunnelLayout(stages, { width: 400, height, gap: 8, tilt: 0.3 });
    const first = layout.stages[0]!;
    const last = layout.stages.at(-1)!;
    expect(first.cap.cy - first.cap.ry).toBeCloseTo(0, 8);
    expect(last.bottom.cy + last.bottom.ry).toBeCloseTo(height, 8);
  });

  it("returns an empty layout for no stages", () => {
    const layout = buildConeFunnelLayout([], { width: 400, height: 500 });
    expect(layout.stages).toEqual([]);
    expect(layout.stageCount).toBe(0);
  });
});
