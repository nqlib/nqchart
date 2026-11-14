import { describe, expect, it } from "vitest";
import {
  buildPieSlices,
  layoutOutsideLabels,
  minVisibleSpan,
  sectorPath,
  slicesBounds,
} from "../pie-sector-geometry";
import {
  CHART_SIGNATURE,
  clampRadius,
  padAngleForGap,
  resolveChartSignature,
} from "../chart-signature";
import { withHeadlessTheme, type HeadlessTheme } from "../headless-theme";

const DEG = Math.PI / 180;
type Pt = { x: number; y: number };

/** Distance from p to the radial ray at angle a (clockwise from 12 o'clock). */
function distToRay(p: Pt, a: number): number {
  // Ray direction u = (sin a, −cos a); perpendicular distance = |p × u|.
  return Math.abs(p.x * -Math.cos(a) - p.y * Math.sin(a));
}

/** Pull every endpoint (the last pair of each command) out of a path. */
function endpoints(path: string): Pt[] {
  const out: Pt[] = [];
  for (const m of path.matchAll(/[MLA]([^MLAZ]+)/g)) {
    const nums = m[1]!.trim().split(/\s+/).map(Number);
    out.push({ x: nums.at(-2)!, y: nums.at(-1)! });
  }
  return out;
}

describe("sectorPath", () => {
  const base = {
    cx: 0,
    cy: 0,
    start: 10 * DEG,
    end: 100 * DEG,
    innerRadius: 30,
    outerRadius: 150,
    gap: 6,
    cornerRadius: 10,
  };

  it("cuts parallel seams: straight edges sit gap/2 from the radial rays", () => {
    const s = sectorPath(base);
    // Straight runs end on `L` commands; their endpoints lie on the edge lines.
    const lines = [...s.path.matchAll(/L ([\d.-]+) ([\d.-]+)/g)].map((m) => ({
      x: Number(m[1]),
      y: Number(m[2]),
    }));
    expect(lines).toHaveLength(2);
    const dists = lines.map((p) =>
      Math.min(distToRay(p, base.start), distToRay(p, base.end)),
    );
    for (const d of dists) expect(d).toBeCloseTo(3, 1);
  });

  it("keeps every vertex between the hub and the rim", () => {
    const s = sectorPath(base);
    for (const p of endpoints(s.path)) {
      const r = Math.hypot(p.x, p.y);
      expect(r).toBeGreaterThanOrEqual(base.innerRadius - 0.02);
      expect(r).toBeLessThanOrEqual(base.outerRadius + 0.02);
    }
    expect(s.outerCorner).toBe(10);
    expect(s.innerCorner).toBe(10);
  });

  it("shrinks the corner radius to fit a narrow slice", () => {
    const s = sectorPath({ ...base, end: base.start + 6 * DEG, cornerRadius: 40 });
    expect(s.path).not.toBe("");
    expect(s.outerCorner).toBeLessThan(40);
  });

  it("ends in a point when the seam cannot reach the hub, and vanishes when it cannot reach the rim", () => {
    const pointed = sectorPath({ ...base, end: base.start + 4 * DEG, innerRadius: 10 });
    expect(pointed.pointed).toBe(true);
    const gone = sectorPath({ ...base, end: base.start + 0.5 * DEG, gap: 6, outerRadius: 100 });
    expect(gone.path).toBe("");
  });

  it("draws a full ring for a single slice", () => {
    const s = sectorPath({ ...base, start: 0, end: 2 * Math.PI });
    expect(s.path.match(/\bA\b/g)?.length).toBe(4);
  });

  it("never emits NaN for a plain pie wedge (no hole, slice > 180°)", () => {
    const s = sectorPath({ ...base, start: 0, end: 270 * DEG, innerRadius: 0 });
    expect(s.path).not.toMatch(/NaN|Infinity/);
    expect(s.pointed).toBe(true);
  });
});

describe("buildPieSlices", () => {
  const values = [40, 30, 20, 10];
  const opts = { cx: 0, cy: 0, innerRadius: 20, outerRadius: 200, gap: 2, cornerRadius: 11 };

  it("plain pie: angle ∝ value, every slice at the full radius", () => {
    const s = buildPieSlices(values, opts);
    expect(s[0]!.end - s[0]!.start).toBeCloseTo(0.4 * 2 * Math.PI, 10);
    expect(s.every((x) => x.outerRadius === 200)).toBe(true);
    expect(s.at(-1)!.end).toBeCloseTo(2 * Math.PI, 10);
  });

  it("rose=radius: angle and radius both ∝ value", () => {
    const s = buildPieSlices(values, { ...opts, rose: "radius" });
    expect(s[1]!.end - s[1]!.start).toBeCloseTo(0.3 * 2 * Math.PI, 10);
    expect(s[0]!.outerRadius).toBe(200);
    expect(s[1]!.outerRadius).toBeCloseTo(20 + 180 * 0.75, 10);
  });

  it("rose=area: equal angles, radius ∝ value, with a visibility floor", () => {
    const s = buildPieSlices([100, 1], { ...opts, rose: "area" });
    expect(s[0]!.end - s[0]!.start).toBeCloseTo(Math.PI, 10);
    expect(s[1]!.outerRadius).toBeCloseTo(20 + 180 * 0.15, 10);
  });

  it("starts at 12 o'clock and runs clockwise", () => {
    const [first] = buildPieSlices([1, 1, 1, 1], opts);
    expect(first!.start).toBe(0);
    // Mid-angle 45°: label anchor up and to the right.
    expect(first!.labelAnchor.x).toBeGreaterThan(0);
    expect(first!.labelAnchor.y).toBeLessThan(0);
  });

  it("scales hub corners with the hole", () => {
    const s = buildPieSlices([1, 1], { ...opts, innerRadius: 10, cornerRadius: 11 });
    expect(s[0]!.innerCorner).toBeLessThanOrEqual(3 + 1e-9);
  });

  it("bounds cover the drawn rim", () => {
    const s = buildPieSlices([1], { ...opts, innerRadius: 0 });
    const b = slicesBounds(s, 0, 0, 0);
    expect(b.maxX).toBeCloseTo(200, 0);
    expect(b.minY).toBeCloseTo(-200, 0);
  });
});

describe("chart-signature", () => {
  it("derives mark / surface radius from --radius and the seam from --chart-gap", () => {
    expect(CHART_SIGNATURE.radius.mark).toBe(3);
    expect(CHART_SIGNATURE.radius.surface).toBe(11);
    expect(CHART_SIGNATURE.radius.join).toBe(3);
    expect(CHART_SIGNATURE.gap.seam).toBe(2);
    expect(CHART_SIGNATURE.gap.stage).toBe(8);
  });

  it("follows a headless theme's radius and gap", () => {
    const theme = {
      isDark: false,
      chrome: {},
      tones: {},
      radiusPx: 12,
      chartGapPx: 4,
      fontFamily: "system-ui",
      animation: false,
    } as unknown as HeadlessTheme;
    const sig = withHeadlessTheme("sig-test", theme, () => resolveChartSignature("sig-test"));
    expect(sig.radius.mark).toBe(8);
    expect(sig.radius.surface).toBe(16);
    expect(sig.gap.seam).toBe(4);
    expect(sig.gap.stage).toBe(16);
  });

  it("clamps radius to half the short side and converts a seam to a pad angle", () => {
    expect(clampRadius(11, 10)).toBe(5);
    expect(padAngleForGap(2, 100)).toBeCloseTo((2 / 100) * (180 / Math.PI), 10);
    expect(padAngleForGap(0, 100)).toBe(0);
  });
});

describe("min visible span + outside labels", () => {
  it("lifts slivers to a visible span and keeps a full turn", () => {
    const s = buildPieSlices([1000, 1], { cx: 0, cy: 0, innerRadius: 0, outerRadius: 100, gap: 2, cornerRadius: 0 });
    expect(s[1]!.path).not.toBe("");
    expect(s[1]!.end - s[1]!.start).toBeCloseTo(minVisibleSpan(2, 100), 10);
    expect(s.at(-1)!.end).toBeCloseTo(2 * Math.PI, 10);
  });

  it("spreads labels on each side so none overlap, inside the canvas", () => {
    const slices = buildPieSlices([30, 1, 1, 1, 1, 30, 1, 1, 1, 1], {
      cx: 200, cy: 150, innerRadius: 0, outerRadius: 100, gap: 2, cornerRadius: 0,
    });
    const labels = layoutOutsideLabels(slices, 200, 150, { height: 300, lineHeight: 16 }).filter(
      (l): l is NonNullable<typeof l> => l != null,
    );
    for (const side of ["left", "right"] as const) {
      const ys = labels.filter((l) => l.align === side).map((l) => l.y).sort((a, b) => a - b);
      for (let k = 1; k < ys.length; k++) expect(ys[k]! - ys[k - 1]!).toBeGreaterThanOrEqual(16 - 1e-9);
      for (const y of ys) {
        expect(y).toBeGreaterThanOrEqual(8);
        expect(y).toBeLessThanOrEqual(292);
      }
    }
  });

  it("starts each leader line on the rim and puts the label beyond its elbow", () => {
    const slices = buildPieSlices([1, 1], { cx: 0, cy: 0, innerRadius: 0, outerRadius: 100, gap: 0, cornerRadius: 0 });
    const [right] = layoutOutsideLabels(slices, 0, 0, { height: 1000 });
    expect(Math.hypot(right!.line[0].x, right!.line[0].y)).toBeCloseTo(100, 6);
    expect(right!.align).toBe("left");
    expect(right!.x).toBeGreaterThan(right!.line[2].x);
  });
});
