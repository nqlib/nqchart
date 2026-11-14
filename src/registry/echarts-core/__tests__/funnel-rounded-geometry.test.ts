import { describe, expect, it } from "vitest";
import {
  DEFAULT_INNER_CORNER_RADIUS,
  DEFAULT_SIDE_CURVE,
  DEFAULT_WIDTH_MODE,
  MAX_RIM_DEPTH,
  buildRoundedFunnelLayout,
  computeStageEdgeWidths,
  filletTangentLength,
  roundedStageOutline,
  roundedTrapezoidPath,
  rimSagittaForEdge,
  subCubic,
  outlineToPath,
  type Cubic,
  type Pt,
  type RoundedStageSpec,
} from "../funnel-rounded-geometry";

const unit = (p: Pt): Pt => {
  const l = Math.hypot(p.x, p.y);
  return { x: p.x / l, y: p.y / l };
};
const dir = (a: Pt, b: Pt): Pt => unit({ x: b.x - a.x, y: b.y - a.y });

function startDir(c: Cubic): Pt {
  return Math.hypot(c.c1.x - c.p0.x, c.c1.y - c.p0.y) > 1e-9
    ? dir(c.p0, c.c1)
    : dir(c.p0, c.c2);
}
function endDir(c: Cubic): Pt {
  return Math.hypot(c.p3.x - c.c2.x, c.p3.y - c.c2.y) > 1e-9
    ? dir(c.c2, c.p3)
    : dir(c.c1, c.p3);
}
function at(c: Cubic, t: number): Pt {
  return subCubic(c, t, t).p0;
}
function sample(c: Cubic, n = 24): Pt[] {
  return Array.from({ length: n + 1 }, (_, i) => at(c, i / n));
}
const angleDeg = (a: Pt, b: Pt) =>
  (Math.acos(Math.min(1, Math.max(-1, a.x * b.x + a.y * b.y))) * 180) / Math.PI;

const baseSpec: RoundedStageSpec = {
  cx: 250,
  y: 0,
  topWidth: 500,
  bottomWidth: 231,
  height: 195,
  cornerRadius: 14,
  sideCurve: 0,
  topSagitta: 15,
  bottomSagitta: 6.9,
};

describe("rimSagittaForEdge", () => {
  it("is proportional to edge width (same rim shape at every width)", () => {
    const h = 200;
    const ratios = [500, 231, 128, 60].map(
      (w) => rimSagittaForEdge(w, 0.03, h) / w,
    );
    for (const r of ratios) expect(r).toBeCloseTo(0.03, 10);
  });

  it("caps depth by stage height and by MAX_RIM_DEPTH", () => {
    expect(rimSagittaForEdge(500, 0.2, 40)).toBeCloseTo(0.15 * 40, 10);
    expect(rimSagittaForEdge(100, 5, 1000)).toBeCloseTo(MAX_RIM_DEPTH * 100, 10);
  });

  it("is 0 for flat rims or degenerate edges", () => {
    expect(rimSagittaForEdge(200, 0, 100)).toBe(0);
    expect(rimSagittaForEdge(0, 0.03, 100)).toBe(0);
  });
});

describe("filletTangentLength", () => {
  const r = 10;
  it("equals r at a right angle", () => {
    expect(filletTangentLength(r, { x: 1, y: 0 }, { x: 0, y: 1 })).toBeCloseTo(r, 10);
  });
  it("grows for acute corners and shrinks for obtuse ones (same visual radius)", () => {
    const a60 = { x: Math.cos(Math.PI / 3), y: Math.sin(Math.PI / 3) };
    const a120 = { x: Math.cos((2 * Math.PI) / 3), y: Math.sin((2 * Math.PI) / 3) };
    expect(filletTangentLength(r, { x: 1, y: 0 }, a60)).toBeCloseTo(r * Math.sqrt(3), 8);
    expect(filletTangentLength(r, { x: 1, y: 0 }, a120)).toBeCloseTo(r / Math.sqrt(3), 8);
  });
  it("is 0 when r is 0", () => {
    expect(filletTangentLength(0, { x: 1, y: 0 }, { x: 0, y: 1 })).toBe(0);
  });
});

describe("roundedStageOutline", () => {
  const variants: Array<Partial<RoundedStageSpec>> = [
    {},
    { sideCurve: 0.5 },
    { sideCurve: 1 },
    { cornerRadius: 40 },
    { topWidth: 160, bottomWidth: 160, topSagitta: 9, bottomSagitta: 9, sideCurve: 0.3 },
    { topWidth: 128, bottomWidth: 0, topSagitta: 3.8, bottomSagitta: 0 },
    { topSagitta: 0, bottomSagitta: 0 },
  ];

  it("joins every edge and fillet without a kink (G1)", () => {
    // Skip the zero-width tip: two walls meet at a point with no edge to fillet.
    for (const v of variants.filter((x) => x.bottomWidth !== 0)) {
      const o = roundedStageOutline({ ...baseSpec, ...v })!;
      const segs = o.segments.filter(
        (s) => Math.hypot(s.p3.x - s.p0.x, s.p3.y - s.p0.y) > 1e-6,
      );
      for (let i = 0; i < segs.length; i++) {
        const a = segs[i]!;
        const b = segs[(i + 1) % segs.length]!;
        expect(Math.hypot(a.p3.x - b.p0.x, a.p3.y - b.p0.y)).toBeLessThan(1e-6);
        expect(angleDeg(endDir(a), startDir(b))).toBeLessThan(0.5);
      }
    }
  });

  it("gives every unclamped corner the same visual radius r = d·tan(θ/2)", () => {
    const r = 14;
    const spec = { ...baseSpec, cornerRadius: r, topSagitta: 0, bottomSagitta: 0 };
    const o = roundedStageOutline(spec)!;
    const TL = { x: 0, y: 0 };
    const TR = { x: 500, y: 0 };
    const BR = { x: 365.5, y: 195 };
    const BL = { x: 134.5, y: 195 };
    // Corner order: TR, BR, BL, TL — each between incoming and outgoing edge.
    const corners: Array<[Pt, Pt, Pt]> = [
      [TR, TL, BR],
      [BR, TR, BL],
      [BL, BR, TL],
      [TL, BL, TR],
    ];
    const ds = o.tangentLengths;
    corners.forEach(([v, prev, next], k) => {
      const a = dir(v, prev);
      const b = dir(v, next);
      const theta = Math.acos(a.x * b.x + a.y * b.y);
      expect(ds[k]! * Math.tan(theta / 2)).toBeCloseTo(r, 6);
    });
    // Acute top corners take longer tangents than obtuse bottom corners.
    expect(ds[0]).toBeGreaterThan(ds[1]);
  });

  it("never lets a fillet take more than half of an adjacent edge", () => {
    const o = roundedStageOutline({ ...baseSpec, topWidth: 60, bottomWidth: 30, cornerRadius: 200 })!;
    const [tr, br, bl, tl] = o.tangentLengths;
    expect(tr + tl).toBeLessThanOrEqual(60 + 1e-6);
    expect(br + bl).toBeLessThanOrEqual(30 + 1e-6);
  });

  it("keeps the right side moving inward down to the bottom rim (no flared foot)", () => {
    for (const v of variants.slice(0, 4)) {
      const o = roundedStageOutline({ ...baseSpec, ...v })!;
      // segments: rim, TR corner, wall, BR corner, bottom rim, …
      const right = o.segments
        .slice(2, 5)
        .flatMap((s) => sample(s))
        .filter((p) => p.x >= baseSpec.cx);
      for (let i = 1; i < right.length; i++) {
        expect(right[i]!.x).toBeLessThanOrEqual(right[i - 1]!.x + 1e-6);
      }
    }
  });

  it("dips both rims downward by exactly their sagitta at the center", () => {
    const o = roundedStageOutline(baseSpec)!;
    const topMid = at(o.segments[0]!, 0.5);
    expect(topMid.x).toBeCloseTo(baseSpec.cx, 6);
    expect(topMid.y).toBeCloseTo(baseSpec.topSagitta!, 6);
    const bottom = o.segments.find(
      (s) => s.role === "edge" && s.p0.y > baseSpec.height / 2 && s.p3.x < s.p0.x,
    )!;
    const botMid = at(bottom, 0.5);
    expect(botMid.x).toBeCloseTo(baseSpec.cx, 6);
    expect(botMid.y).toBeCloseTo(baseSpec.height + baseSpec.bottomSagitta!, 6);
  });
});

describe("roundedTrapezoidPath", () => {
  it("draws straight walls as lines when sideCurve is 0", () => {
    const path = roundedTrapezoidPath(baseSpec);
    expect(path.match(/\bL\b/g)?.length).toBe(2);
    expect(path.startsWith("M ")).toBe(true);
    expect(path.endsWith("Z")).toBe(true);
  });

  it("is a plain trapezoid with no radius, rim or bow", () => {
    const path = roundedTrapezoidPath({
      ...baseSpec,
      cornerRadius: 0,
      topSagitta: 0,
      bottomSagitta: 0,
    });
    expect(path).toBe("M 0 0 L 500 0 L 365.5 195 L 134.5 195 L 0 0 Z");
  });

  it("bows walls inward with sideCurve", () => {
    const path = roundedTrapezoidPath({ ...baseSpec, sideCurve: 0.5 });
    expect(path).not.toMatch(/\bL\b/);
  });

  it("returns empty when height is zero and stays finite at a zero-width tip", () => {
    expect(roundedTrapezoidPath({ ...baseSpec, height: 0 })).toBe("");
    const tip = roundedTrapezoidPath({ ...baseSpec, bottomWidth: 0, bottomSagitta: 0 });
    expect(tip).not.toMatch(/NaN|Infinity/);
  });
});

describe("buildRoundedFunnelLayout", () => {
  const stages = [{ value: 248_600 }, { value: 96_400 }, { value: 42_000 }];
  const opts = {
    width: 280,
    height: 220,
    gap: 10,
    cornerRadius: 14,
    sideCurve: 0.2,
    rimDepth: 0.03,
    minSizeRatio: 0.12,
  };

  it("defaults: taper, radius 11, gap 8, flat rims, no bow", () => {
    expect(DEFAULT_WIDTH_MODE).toBe("taper");
    const layout = buildRoundedFunnelLayout([{ value: 1 }], { width: 100, height: 80 });
    expect(layout.cornerRadius).toBe(11);
    expect(layout.gap).toBe(8);
    expect(layout.sideCurve).toBe(DEFAULT_SIDE_CURVE);
    expect(layout.rimDepth).toBe(0);
    expect(layout.widthMode).toBe("taper");
  });

  it("emits one closed path, label and width per stage", () => {
    const layout = buildRoundedFunnelLayout(stages, opts);
    expect(layout.stageCount).toBe(3);
    expect(layout.stagePaths).toHaveLength(3);
    expect(layout.labelCenters).toHaveLength(3);
    expect(layout.stagePaths.every((p) => p.startsWith("M ") && p.endsWith("Z"))).toBe(true);
  });

  it("taper: bottom_i === top_{i+1} for widths and rim depths", () => {
    const layout = buildRoundedFunnelLayout(stages, opts);
    expect(layout.edgeWidths).toEqual(
      computeStageEdgeWidths(stages.map((s) => s.value), 280, 0.12, "taper"),
    );
    for (let i = 0; i < layout.stageCount - 1; i++) {
      expect(layout.edgeWidths[i]!.bottom).toBe(layout.edgeWidths[i + 1]!.top);
      expect(layout.rimSagittas[i]!.bottom).toBe(layout.rimSagittas[i + 1]!.top);
      expect(layout.rimSagittas[i]!.bottom).toBeGreaterThan(0);
    }
    expect(layout.edgeWidths[2]!.bottom).toBeCloseTo(280 * 0.12, 6);
  });

  it("keeps rim depth / width constant across stages", () => {
    const layout = buildRoundedFunnelLayout(stages, opts);
    layout.edgeWidths.forEach((e, i) => {
      expect(layout.rimSagittas[i]!.top / e.top).toBeCloseTo(0.03, 10);
    });
  });

  it("fits the last bulging rim inside the height and centers labels on the band", () => {
    const layout = buildRoundedFunnelLayout(stages, opts);
    const n = layout.stageCount;
    const lastBottom =
      (n - 1) * (layout.stageHeight + layout.gap) +
      layout.stageHeight +
      layout.rimSagittas[n - 1]!.bottom;
    expect(lastBottom).toBeLessThanOrEqual(220 + 1e-6);
    const s = layout.rimSagittas[0]!;
    expect(layout.labelCenters[0]!.y).toBeCloseTo(
      (s.top + layout.stageHeight + s.bottom) / 2,
      6,
    );
  });

  it("capsule mode: each stage width tracks scale(value)", () => {
    const layout = buildRoundedFunnelLayout(
      [{ value: 100 }, { value: 50 }, { value: 25 }],
      { width: 200, height: 120, gap: 0, cornerRadius: 8, minSizeRatio: 0.12, widthMode: "capsule" },
    );
    const minW = 200 * 0.12;
    const scale = (v: number) => minW + (200 - minW) * (v / 100);
    expect(layout.widthMode).toBe("capsule");
    expect(layout.stageWidths[1]).toBeCloseTo(scale(50), 6);
    expect(layout.edgeWidths[1]!.top).toBe(layout.edgeWidths[1]!.bottom);
  });

  describe("outer vs inner corners", () => {
    // Flat rims + straight walls so each corner's interior angle comes from
    // the vertices alone; tall stages so no fillet hits the half-edge cap.
    const flat = { width: 500, height: 600, gap: 10, sideCurve: 0, rimDepth: 0, minSizeRatio: 0.12 };

    /** Visual radius `d·tan(θ/2)` per corner (TR, BR, BL, TL) for stage i. */
    function stageRadii(
      layout: ReturnType<typeof buildRoundedFunnelLayout>,
      i: number,
      topR: number,
      botR: number,
    ): number[] {
      const { top, bottom } = layout.edgeWidths[i]!;
      const cx = flat.width / 2;
      const y = i * (layout.stageHeight + layout.gap);
      const h = layout.stageHeight;
      const spec: RoundedStageSpec = {
        cx,
        y,
        topWidth: top,
        bottomWidth: bottom,
        height: h,
        cornerRadius: layout.cornerRadius,
        topCornerRadius: topR,
        bottomCornerRadius: botR,
        sideCurve: 0,
        topSagitta: 0,
        bottomSagitta: 0,
      };
      const o = roundedStageOutline(spec)!;
      // The layout drew exactly this outline.
      expect(outlineToPath(o)).toBe(layout.stagePaths[i]);
      const TL = { x: cx - top / 2, y };
      const TR = { x: cx + top / 2, y };
      const BR = { x: cx + bottom / 2, y: y + h };
      const BL = { x: cx - bottom / 2, y: y + h };
      const corners: Array<[Pt, Pt, Pt]> = [
        [TR, TL, BR],
        [BR, TR, BL],
        [BL, BR, TL],
        [TL, BL, TR],
      ];
      return corners.map(([v, prev, next], k) => {
        const a = dir(v, prev);
        const b = dir(v, next);
        const theta = Math.acos(a.x * b.x + a.y * b.y);
        return o.tangentLengths[k]! * Math.tan(theta / 2);
      });
    }

    it("defaults inner corners to DEFAULT_INNER_CORNER_RADIUS", () => {
      expect(DEFAULT_INNER_CORNER_RADIUS).toBe(3);
      const layout = buildRoundedFunnelLayout([{ value: 1 }], { width: 100, height: 80 });
      expect(layout.innerCornerRadius).toBe(3);
    });

    it("uses cornerRadius only on the funnel's outer corners", () => {
      const R = 14;
      const r = 3;
      const layout = buildRoundedFunnelLayout(stages, {
        ...flat,
        cornerRadius: R,
        innerCornerRadius: r,
      });
      expect(layout.innerCornerRadius).toBe(r);
      const n = layout.stageCount;
      for (let i = 0; i < n; i++) {
        const topR = i === 0 ? R : r;
        const botR = i === n - 1 ? R : r;
        const [tr, br, bl, tl] = stageRadii(layout, i, topR, botR);
        expect(tr).toBeCloseTo(topR, 6);
        expect(tl).toBeCloseTo(topR, 6);
        expect(br).toBeCloseTo(botR, 6);
        expect(bl).toBeCloseTo(botR, 6);
      }
    });

    it("gives a single stage cornerRadius on all four corners", () => {
      const layout = buildRoundedFunnelLayout([{ value: 10 }], {
        ...flat,
        cornerRadius: 14,
        innerCornerRadius: 3,
      });
      for (const v of stageRadii(layout, 0, 14, 14)) expect(v).toBeCloseTo(14, 6);
    });

    it("clamps innerCornerRadius to cornerRadius", () => {
      const layout = buildRoundedFunnelLayout(stages, {
        ...flat,
        cornerRadius: 8,
        innerCornerRadius: 30,
      });
      expect(layout.innerCornerRadius).toBe(8);
      for (let i = 0; i < layout.stageCount; i++) {
        for (const v of stageRadii(layout, i, 8, 8)) expect(v).toBeCloseTo(8, 6);
      }
    });
  });

  it("returns an empty layout for no stages", () => {
    const layout = buildRoundedFunnelLayout([], opts);
    expect(layout.stagePaths).toEqual([]);
    expect(layout.stageCount).toBe(0);
  });
});
