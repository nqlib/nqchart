/**
 * Pie / rose slice geometry with the NQChart signature: parallel seams and
 * true circular corners.
 *
 * ECharts' own `padAngle` opens wedge-shaped gaps (wide at the rim, closed at
 * the hub). The signature wants an even seam, so each slice is cut by two lines
 * parallel to its radial edges, `gap / 2` inside them. Every corner is then
 * filleted with a real circle:
 * - outer corners: a circle of radius `rc` tangent to the edge line and
 *   internally tangent to the rim (`|center| = R − rc`);
 * - inner corners: tangent to the edge line and externally tangent to the hub
 *   (`|center| = rIn + rc`).
 * When a slice is too narrow for the requested radius, the radius shrinks
 * until the fillets fit; when it is too narrow to reach the hub, the two edge
 * lines meet in a point.
 *
 * Angles run clockwise from 12 o'clock, in radians.
 */

export type Pt = { x: number; y: number };

export type SectorSpec = {
  cx: number;
  cy: number;
  /** Start / end angle, clockwise from 12 o'clock (radians), start < end. */
  start: number;
  end: number;
  innerRadius: number;
  outerRadius: number;
  /** Full seam width between this slice and its neighbours (px). */
  gap: number;
  /** Corner radius for the rim corners (px). */
  cornerRadius: number;
  /** Corner radius for the hub corners (px). Defaults to `cornerRadius`. */
  innerCornerRadius?: number;
};

export type SectorShape = {
  path: string;
  /** Corner radii actually used after fitting. */
  outerCorner: number;
  innerCorner: number;
  /** True when the slice is too narrow to reach the hub (pointed inner end). */
  pointed: boolean;
};

const EPS = 1e-9;

const fmt = (n: number) => String(Math.round(n * 100) / 100 + 0);
const P = (p: Pt) => `${fmt(p.x)} ${fmt(p.y)}`;

/** Unit vector pointing out along angle `a` (clockwise from 12 o'clock). */
function radial(a: number): Pt {
  return { x: Math.sin(a), y: -Math.cos(a) };
}
/** Unit vector pointing toward increasing angle (clockwise) at `a`. */
function tangential(a: number): Pt {
  return { x: Math.cos(a), y: Math.sin(a) };
}
const add = (a: Pt, b: Pt): Pt => ({ x: a.x + b.x, y: a.y + b.y });
const mul = (a: Pt, k: number): Pt => ({ x: a.x * k, y: a.y * k });
/** Clockwise angle (from 12 o'clock) of a point relative to the origin. */
const angleOf = (p: Pt) => Math.atan2(p.x, -p.y);

/**
 * One edge of the slice: the radial ray at `angle`, shifted `offset` px toward
 * the slice interior (`side = +1` for the start edge, `−1` for the end edge).
 * Points on it are `n·offset + u·t` (origin-relative).
 */
type Edge = { u: Pt; n: Pt; offset: number };

function edge(angle: number, side: 1 | -1, offset: number): Edge {
  return { u: radial(angle), n: mul(tangential(angle), side), offset };
}
const onEdge = (e: Edge, t: number, extra = 0): Pt =>
  add(mul(e.n, e.offset + extra), mul(e.u, t));

/** Rim corner: fillet center + tangent points (origin-relative), or null. */
function rimCorner(e: Edge, R: number, rc: number) {
  const d = R - rc;
  const k = e.offset + rc;
  if (d <= k) return null;
  const t = Math.sqrt(d * d - k * k);
  const center = onEdge(e, t, rc);
  return { center, onLine: onEdge(e, t), onArc: mul(center, R / d), t };
}

/** Hub corner: fillet center + tangent points (origin-relative), or null. */
function hubCorner(e: Edge, rIn: number, rc: number) {
  const d = rIn + rc;
  const k = e.offset + rc;
  if (d <= k) return null;
  const t = Math.sqrt(d * d - k * k);
  const center = onEdge(e, t, rc);
  return { center, onLine: onEdge(e, t), onArc: mul(center, rIn / d), t };
}

/** Clockwise sweep from angle a to angle b, in [0, 2π). */
function sweep(a: number, b: number): number {
  const s = (b - a) % (2 * Math.PI);
  return s < 0 ? s + 2 * Math.PI : s;
}

/** Closed SVG path for one slice; empty string when the slice cannot be drawn. */
export function sectorPath(spec: SectorSpec): SectorShape {
  const { cx, cy, start, end } = spec;
  const R = Math.max(spec.outerRadius, 0);
  const rIn = Math.max(Math.min(spec.innerRadius, R), 0);
  const h = Math.max(spec.gap, 0) / 2;
  const span = end - start;
  const empty: SectorShape = { path: "", outerCorner: 0, innerCorner: 0, pointed: false };
  if (R <= EPS || span <= EPS) return empty;
  const at = (p: Pt) => ({ x: cx + p.x, y: cy + p.y });

  // A full ring (one slice) has no edges to cut.
  if (span >= 2 * Math.PI - 1e-6) {
    const top = at({ x: 0, y: -R });
    const bottom = at({ x: 0, y: R });
    let path = `M ${P(top)} A ${fmt(R)} ${fmt(R)} 0 1 1 ${P(bottom)} A ${fmt(R)} ${fmt(R)} 0 1 1 ${P(top)} Z`;
    if (rIn > EPS) {
      const it = at({ x: 0, y: -rIn });
      const ib = at({ x: 0, y: rIn });
      path += ` M ${P(it)} A ${fmt(rIn)} ${fmt(rIn)} 0 1 0 ${P(ib)} A ${fmt(rIn)} ${fmt(rIn)} 0 1 0 ${P(it)} Z`;
    }
    return { path, outerCorner: 0, innerCorner: 0, pointed: false };
  }

  const s = edge(start, 1, h);
  const e = edge(end, -1, h);
  // The two edge lines meet on the bisector at this distance from the center
  // (for slices wider than 180° the meeting point is the reflex inner corner).
  const apex = h > EPS ? h / Math.sin(span / 2) : 0;
  if (apex >= R - EPS) return empty;
  // The hub is narrower than the seam can reach: the slice ends in a point.
  const pointed = apex >= rIn - EPS;

  // Fit the corner radii: shrink until fillets exist, stay in order along the
  // rim, and leave a non-negative straight run on each edge.
  const fits = (rco: number, rci: number) => {
    const so = rimCorner(s, R, rco);
    const eo = rimCorner(e, R, rco);
    if (!so || !eo) return null;
    if (sweep(angleOf(so.onArc), angleOf(eo.onArc)) > span + 1e-6) return null;
    if (pointed) {
      const apexT = apex * Math.cos(span / 2);
      if (so.t < apexT || eo.t < apexT) return null;
      return { so, eo, si: null, ei: null };
    }
    const si = rci > EPS ? hubCorner(s, rIn, rci) : null;
    const ei = rci > EPS ? hubCorner(e, rIn, rci) : null;
    if (rci > EPS && (!si || !ei)) return null;
    const sInT = si ? si.t : Math.sqrt(Math.max(rIn * rIn - h * h, 0));
    const eInT = ei ? ei.t : Math.sqrt(Math.max(rIn * rIn - h * h, 0));
    if (so.t < sInT - 1e-6 || eo.t < eInT - 1e-6) return null;
    if (si && ei && sweep(angleOf(si.onArc), angleOf(ei.onArc)) > span + 1e-6) return null;
    return { so, eo, si, ei, sInT, eInT };
  };

  let rco = Math.max(spec.cornerRadius, 0);
  let rci = pointed ? 0 : Math.max(spec.innerCornerRadius ?? spec.cornerRadius, 0);
  let fit = fits(rco, rci);
  for (let i = 0; i < 40 && !fit; i++) {
    rco *= 0.85;
    rci *= 0.85;
    if (rco < 0.05) rco = 0;
    if (rci < 0.05) rci = 0;
    fit = fits(rco, rci);
  }
  if (!fit) return empty;

  const { so, eo } = fit;
  const parts: string[] = [];
  const outerSweep = sweep(angleOf(so.onArc), angleOf(eo.onArc));
  parts.push(`M ${P(at(so.onArc))}`);
  parts.push(`A ${fmt(R)} ${fmt(R)} 0 ${outerSweep > Math.PI ? 1 : 0} 1 ${P(at(eo.onArc))}`);
  if (rco > EPS) parts.push(`A ${fmt(rco)} ${fmt(rco)} 0 0 1 ${P(at(eo.onLine))}`);

  if (pointed) {
    const apexPt = mul(radial(start + span / 2), apex);
    parts.push(`L ${P(at(apexPt))}`);
  } else {
    const { si, ei } = fit as { si: ReturnType<typeof hubCorner>; ei: ReturnType<typeof hubCorner> };
    const eLine = ei ? ei.onLine : onEdge(e, (fit as { eInT: number }).eInT);
    const sLine = si ? si.onLine : onEdge(s, (fit as { sInT: number }).sInT);
    const eHub = ei ? ei.onArc : eLine;
    const sHub = si ? si.onArc : sLine;
    parts.push(`L ${P(at(eLine))}`);
    if (ei) parts.push(`A ${fmt(rci)} ${fmt(rci)} 0 0 1 ${P(at(eHub))}`);
    if (rIn > EPS) {
      const innerSweep = sweep(angleOf(sHub), angleOf(eHub));
      parts.push(`A ${fmt(rIn)} ${fmt(rIn)} 0 ${innerSweep > Math.PI ? 1 : 0} 0 ${P(at(sHub))}`);
    }
    if (si) parts.push(`A ${fmt(rci)} ${fmt(rci)} 0 0 1 ${P(at(sLine))}`);
  }
  parts.push(`L ${P(at(so.onLine))}`);
  if (rco > EPS) parts.push(`A ${fmt(rco)} ${fmt(rco)} 0 0 1 ${P(at(so.onArc))}`);
  parts.push("Z");

  return { path: parts.join(" "), outerCorner: rco, innerCorner: rci, pointed };
}

export type RoseMode = "radius" | "area";

/** Hub corner radius cap as a fraction of the hole radius. */
const HUB_CORNER_FRACTION = 0.3;

export type PieLayoutOptions = {
  cx: number;
  cy: number;
  innerRadius: number;
  outerRadius: number;
  gap: number;
  cornerRadius: number;
  /**
   * `radius` — angle and radius both ∝ value; `area` — equal angles, radius
   * ∝ value; omitted — a plain pie / donut (angle ∝ value, full radius).
   */
  rose?: RoseMode;
  /**
   * Smallest rose radius as a fraction of the ring depth, so tiny values stay
   * visible and hoverable. Default 0.15.
   */
  roseMinFraction?: number;
};

export type PieSlice = SectorShape & {
  start: number;
  end: number;
  outerRadius: number;
  /** Mid-angle point halfway through the ring — for inside labels. */
  centroid: Pt;
  /** Mid-angle point just outside the rim — for outside labels. */
  labelAnchor: Pt;
  /** Mid-angle (radians, clockwise from 12 o'clock). */
  midAngle: number;
};

/**
 * Smallest angular span (radians) that keeps a slice visible: the seam's two
 * edge lines meet at `gap/2 / sin(span/2)`, which must stay within the inner
 * half of the slice.
 */
export function minVisibleSpan(gap: number, outerRadius: number): number {
  const h = Math.max(gap, 0) / 2;
  if (h <= 0 || outerRadius <= 0) return 0;
  return 2 * Math.asin(Math.min(1, h / (0.5 * outerRadius)));
}

/**
 * Value-proportional spans (or equal spans for `equal`), with every non-zero
 * slice lifted to its minimum visible span; the lift is taken proportionally
 * from slices that have room to spare, so the total stays a full turn.
 */
function sliceAngles(
  vals: number[],
  total: number,
  equal: boolean,
  minSpanOf: (i: number) => number,
): number[] {
  const n = vals.length;
  const full = 2 * Math.PI;
  const raw = vals.map((v) => (equal ? full / n : total > 0 ? (v / total) * full : 0));
  if (equal) return raw;
  const mins = vals.map((v, i) => (v > 0 ? minSpanOf(i) : 0));
  const lifted = raw.map((a, i) => Math.max(a, mins[i]!));
  const deficit = lifted.reduce((s, a, i) => s + (a - raw[i]!), 0);
  if (deficit <= 0) return raw;
  const spare = raw.reduce((s, a, i) => s + Math.max(0, a - mins[i]!), 0);
  if (spare <= deficit) return raw; // too many slivers to rescue — keep proportions
  return lifted.map((a, i) =>
    a > mins[i]! ? a - deficit * ((a - mins[i]!) / spare) : a,
  );
}

/** Lay out slices clockwise from 12 o'clock, in the order given. */
export function buildPieSlices(values: number[], opts: PieLayoutOptions): PieSlice[] {
  const n = values.length;
  if (n === 0) return [];
  const vals = values.map((v) => (Number.isFinite(v) && v > 0 ? v : 0));
  const total = vals.reduce((a, b) => a + b, 0);
  const max = Math.max(...vals, 0);
  const rIn = Math.max(0, Math.min(opts.innerRadius, opts.outerRadius));
  const depth = Math.max(opts.outerRadius - rIn, 0);
  const minFrac = Math.min(1, Math.max(0, opts.roseMinFraction ?? 0.15));

  const radiusOf = (i: number) =>
    opts.rose && max > 0
      ? rIn + depth * Math.max(minFrac, vals[i]! / max)
      : opts.outerRadius;
  const angles = sliceAngles(vals, total, opts.rose === "area", (i) =>
    // Smallest span whose seam still leaves the outer half of the slice drawn.
    minVisibleSpan(opts.gap, radiusOf(i)),
  );
  const sliceAngle = (i: number) => angles[i]!;

  const slices: PieSlice[] = [];
  let a = 0;
  for (let i = 0; i < n; i++) {
    const start = a;
    const end = a + sliceAngle(i);
    a = end;
    const R = radiusOf(i);
    const shape = sectorPath({
      cx: opts.cx,
      cy: opts.cy,
      start,
      end,
      innerRadius: rIn,
      outerRadius: R,
      gap: opts.gap,
      cornerRadius: opts.cornerRadius,
      // Hub corners scale with the hub so a small hole never gets hooked corners.
      innerCornerRadius: Math.min(opts.cornerRadius, rIn * HUB_CORNER_FRACTION),
    });
    const mid = (start + end) / 2;
    const dir = radial(mid);
    slices.push({
      ...shape,
      start,
      end,
      outerRadius: R,
      midAngle: mid,
      centroid: { x: opts.cx + dir.x * (rIn + R) / 2, y: opts.cy + dir.y * (rIn + R) / 2 },
      labelAnchor: { x: opts.cx + dir.x * (R + 10), y: opts.cy + dir.y * (R + 10) },
    });
  }
  return slices;
}

/**
 * Bounding box of a slice layout (rim arcs + hub), sampled along each arc.
 * Used to fit a lopsided rose into its canvas.
 */
export function slicesBounds(slices: PieSlice[], cx: number, cy: number, innerRadius: number) {
  let minX = cx - innerRadius;
  let maxX = cx + innerRadius;
  let minY = cy - innerRadius;
  let maxY = cy + innerRadius;
  for (const sl of slices) {
    if (!sl.path) continue;
    const steps = Math.max(2, Math.ceil(((sl.end - sl.start) / Math.PI) * 48));
    for (let k = 0; k <= steps; k++) {
      const a = sl.start + ((sl.end - sl.start) * k) / steps;
      const x = cx + Math.sin(a) * sl.outerRadius;
      const y = cy - Math.cos(a) * sl.outerRadius;
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
    }
  }
  return { minX, maxX, minY, maxY };
}

export type SliceLabel = {
  index: number;
  /** Leader line: rim → radial elbow → horizontal run. */
  line: [Pt, Pt, Pt];
  /** Text anchor (vertically centered). */
  x: number;
  y: number;
  align: "left" | "right";
};

export type OutsideLabelOptions = {
  /** Canvas height — labels stay inside it. */
  height: number;
  lineHeight?: number;
  /** Radial leg of the leader line (px). */
  radialLength?: number;
  /** Horizontal leg of the leader line (px). */
  elbowLength?: number;
  /** Slices narrower than this (radians) get no label. */
  minAngle?: number;
};

/**
 * Outside slice labels on two-leg leader lines, the classic pie layout:
 * labels sit left or right of the pie by the slice's mid-angle, and each side
 * is spread vertically so neighbouring labels never overlap.
 */
export function layoutOutsideLabels(
  slices: PieSlice[],
  cx: number,
  cy: number,
  opts: OutsideLabelOptions,
): Array<SliceLabel | null> {
  const lh = opts.lineHeight ?? 14;
  const radialLength = opts.radialLength ?? 10;
  const elbow = opts.elbowLength ?? 10;
  const minAngle = opts.minAngle ?? 0;
  const out: Array<SliceLabel | null> = slices.map(() => null);

  type Pending = { index: number; p0: Pt; p1: Pt; side: 1 | -1; y: number };
  const sides: Record<"1" | "-1", Pending[]> = { "1": [], "-1": [] };
  slices.forEach((sl, index) => {
    if (!sl.path || sl.end - sl.start < minAngle) return;
    const d = radial(sl.midAngle);
    const p0 = { x: cx + d.x * sl.outerRadius, y: cy + d.y * sl.outerRadius };
    const p1 = {
      x: cx + d.x * (sl.outerRadius + radialLength),
      y: cy + d.y * (sl.outerRadius + radialLength),
    };
    const side: 1 | -1 = d.x >= 0 ? 1 : -1;
    sides[side === 1 ? "1" : "-1"].push({ index, p0, p1, side, y: p1.y });
  });

  const top = lh / 2;
  const bottom = Math.max(top, opts.height - lh / 2);
  for (const list of Object.values(sides)) {
    list.sort((a, b) => a.y - b.y);
    // Push down to clear the label above, then pull up from the bottom edge.
    for (let k = 0; k < list.length; k++) {
      const prev = k > 0 ? list[k - 1]!.y + lh : top;
      list[k]!.y = Math.max(list[k]!.y, prev);
    }
    for (let k = list.length - 1; k >= 0; k--) {
      const next = k < list.length - 1 ? list[k + 1]!.y - lh : bottom;
      list[k]!.y = Math.min(list[k]!.y, next);
    }
    for (const it of list) {
      const p2 = { x: it.p1.x + it.side * elbow, y: it.y };
      out[it.index] = {
        index: it.index,
        line: [it.p0, { x: it.p1.x, y: it.p1.y }, p2],
        x: p2.x + it.side * 4,
        y: it.y,
        align: it.side === 1 ? "left" : "right",
      };
    }
  }
  return out;
}
