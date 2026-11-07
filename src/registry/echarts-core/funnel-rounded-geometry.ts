/**
 * Rounded-funnel stage geometry (vertical soft stages with curved rims).
 *
 * Construction order — every step is proportional to the stage it acts on:
 * 1. Silhouette: a trapezoid per stage. In `widthMode="taper"` stage i's bottom
 *    width equals stage i+1's top width, so the outline is one continuous taper.
 * 2. Rims: each horizontal edge bows downward with depth `rimDepth · edgeWidth`
 *    (a perspective ellipse, so every rim has the same shape at any width).
 *    Depth depends only on the edge width, so the two sides of a gap get the
 *    same curve and the gap reads as a parallel ribbon.
 * 3. Walls: straight lines from vertex to vertex, optionally bowed inward along
 *    the wall normal by `sideCurve` (relative to wall length).
 * 4. Corners: true fillets. At each vertex the tangent length is
 *    `d = r / tan(θ/2)` (θ = interior angle between the two edge tangents), so
 *    acute and obtuse corners show the same visual radius `r`. The fillet is a
 *    cubic whose handles sit on both edge tangents, so it joins rim and wall
 *    without a kink (G1).
 * 5. Outer vs inner corners: only the funnel's outer corners (top of the first
 *    stage, bottom of the last) use the full `cornerRadius`. Every corner that
 *    faces a gap uses the small `innerCornerRadius`, so the silhouette flows
 *    continuously from layer to layer instead of reading as separate pills.
 *    A single-stage funnel gets `cornerRadius` on all four corners.
 *
 * The only per-corner clamp is "a fillet may not eat more than half of either
 * adjacent edge", so all corners keep the requested radius until the stage is
 * physically too small for it.
 */

import { CHART_SIGNATURE } from "./chart-signature";

export type RoundedStageInput = {
  value: number;
};

/** How stage widths are derived from values. */
export type RoundedWidthMode =
  /**
   * Canonical curved funnel: continuous taper.
   * top=`scale(v_i)`, bottom=`scale(v_{i+1})`, last tip → `minSize` floor.
   * Guarantees `bottom_i === top_{i+1}` as numbers for shared-edge matching.
   */
  | "taper"
  /** Value-true bands: top=bottom=`scale(value)`. */
  | "capsule";

export type RoundedGeometryOptions = {
  width: number;
  height: number;
  /** Vertical gap between stages in px. */
  gap?: number;
  /**
   * Visual radius in px of the funnel's outer corners (top of the first stage,
   * bottom of the last). Clamped only to fit.
   */
  cornerRadius?: number;
  /**
   * Visual radius in px of every corner facing a gap. Clamped to
   * `cornerRadius`. Default `DEFAULT_INNER_CORNER_RADIUS`.
   */
  innerCornerRadius?: number;
  /** Inward wall bow (0 = straight sides, 1 = max). */
  sideCurve?: number;
  /**
   * Rim depth as a fraction of the edge width (0 = flat rims). The rim's
   * midpoint sits `rimDepth · edgeWidth` below its endpoints.
   */
  rimDepth?: number;
  /** Floor width as a fraction of `width` (0–1). */
  minSizeRatio?: number;
  /** Width model. Default `"taper"`. */
  widthMode?: RoundedWidthMode;
};

/** Per-stage top/bottom widths in px (taper: bottom_i === top_{i+1}). */
export type StageEdgeWidths = {
  top: number;
  bottom: number;
};

export type RoundedLayout = {
  stagePaths: string[];
  /** Visual center of each stage band (accounts for rim depth) — for labels. */
  labelCenters: Array<{ x: number; y: number }>;
  /** Value-true band width per stage (px) — `scale(value_i)`. */
  stageWidths: number[];
  /** Top/bottom edge widths per stage (px). */
  edgeWidths: StageEdgeWidths[];
  /** Top/bottom rim depth per stage (px). Taper: bottom_i === top_{i+1}. */
  rimSagittas: StageEdgeWidths[];
  stageCount: number;
  stageHeight: number;
  gap: number;
  cornerRadius: number;
  innerCornerRadius: number;
  sideCurve: number;
  rimDepth: number;
  widthMode: RoundedWidthMode;
};

const DEFAULT_CORNER_RADIUS = CHART_SIGNATURE.radius.surface;
const DEFAULT_GAP = CHART_SIGNATURE.gap.stage;
/**
 * Default radius (px) of corners facing a gap — the signature join radius (`--radius-sm`)
 * so inner corners read as crisp but not sharp.
 */
export const DEFAULT_INNER_CORNER_RADIUS = CHART_SIGNATURE.radius.join;
const DEFAULT_MIN_SIZE_RATIO = 0.12;
/** Default side bow: off. */
export const DEFAULT_SIDE_CURVE = 0;
/** Default rim depth for `connection="rounded"` (3% of the edge width). */
export const DEFAULT_RIM_DEPTH = 0.03;
/** Upper bound for `rimDepth` — beyond this rims read as bowls, not perspective. */
export const MAX_RIM_DEPTH = 0.2;
/** Canonical curved funnel for `connection="rounded"`. */
export const DEFAULT_WIDTH_MODE: RoundedWidthMode = "taper";

/** Rim depth may not exceed this fraction of the stage height. */
const RIM_DEPTH_OVER_HEIGHT = 0.15;
/**
 * Wall bow at `sideCurve=1`, as a fraction of wall length. Both cubic controls
 * shift by this amount, so the wall midpoint moves by 0.75× of it.
 */
const SIDE_BOW_OVER_LENGTH = 0.16;
/** A fillet may consume at most this fraction of each adjacent edge. */
const FILLET_MAX_EDGE_FRACTION = 0.5;

const EPS = 1e-9;

// ---------------------------------------------------------------------------
// Vector helpers
// ---------------------------------------------------------------------------

export type Pt = { x: number; y: number };

const pt = (x: number, y: number): Pt => ({ x, y });
const add = (a: Pt, b: Pt): Pt => pt(a.x + b.x, a.y + b.y);
const sub = (a: Pt, b: Pt): Pt => pt(a.x - b.x, a.y - b.y);
const mul = (a: Pt, k: number): Pt => pt(a.x * k, a.y * k);
const lerp = (a: Pt, b: Pt, t: number): Pt => add(a, mul(sub(b, a), t));
const dot = (a: Pt, b: Pt): number => a.x * b.x + a.y * b.y;
const cross = (a: Pt, b: Pt): number => a.x * b.y - a.y * b.x;
const len = (a: Pt): number => Math.hypot(a.x, a.y);

function unit(a: Pt): Pt | null {
  const l = len(a);
  return l > EPS ? mul(a, 1 / l) : null;
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

function fmt(n: number): string {
  // Two decimals, trailing zeros dropped; normalize -0.
  return String(Math.round(n * 100) / 100 + 0);
}

// ---------------------------------------------------------------------------
// Cubic Bézier edges
// ---------------------------------------------------------------------------

/** Cubic Bézier `p0 → p3` with controls `c1`, `c2`. */
export type Cubic = { p0: Pt; c1: Pt; c2: Pt; p3: Pt; straight: boolean };

function cubicFromQuad(p0: Pt, ctrl: Pt, p2: Pt, straight: boolean): Cubic {
  return {
    p0,
    c1: lerp(p0, ctrl, 2 / 3),
    c2: lerp(p2, ctrl, 2 / 3),
    p3: p2,
    straight,
  };
}

/** Polar-form (blossom) evaluation of a cubic at (a, b, c). */
function blossom(e: Cubic, a: number, b: number, c: number): Pt {
  const l1 = [lerp(e.p0, e.c1, a), lerp(e.c1, e.c2, a), lerp(e.c2, e.p3, a)];
  const l2 = [lerp(l1[0]!, l1[1]!, b), lerp(l1[1]!, l1[2]!, b)];
  return lerp(l2[0]!, l2[1]!, c);
}

/** Sub-curve of `e` on `[t0, t1]`. */
export function subCubic(e: Cubic, t0: number, t1: number): Cubic {
  return {
    p0: blossom(e, t0, t0, t0),
    c1: blossom(e, t0, t0, t1),
    c2: blossom(e, t0, t1, t1),
    p3: blossom(e, t1, t1, t1),
    straight: e.straight,
  };
}

/** Unit tangent leaving `e.p0` (forward direction). */
function startTangent(e: Cubic): Pt | null {
  return unit(sub(e.c1, e.p0)) ?? unit(sub(e.c2, e.p0)) ?? unit(sub(e.p3, e.p0));
}

/** Unit tangent arriving at `e.p3` (forward direction). */
function endTangent(e: Cubic): Pt | null {
  return unit(sub(e.p3, e.c2)) ?? unit(sub(e.p3, e.c1)) ?? unit(sub(e.p3, e.p0));
}

// ---------------------------------------------------------------------------
// Rims, walls, fillets
// ---------------------------------------------------------------------------

/**
 * Rim depth (px) for a horizontal edge — proportional to the edge width so
 * every rim has the same shape. Depends only on width + stage height, so two
 * stages sharing an edge width get the identical curve.
 */
export function rimSagittaForEdge(
  edgeWidth: number,
  rimDepth: number,
  stageHeight: number,
): number {
  if (edgeWidth <= 0 || rimDepth <= 0 || stageHeight <= 0) return 0;
  return Math.min(
    clamp(rimDepth, 0, MAX_RIM_DEPTH) * edgeWidth,
    RIM_DEPTH_OVER_HEIGHT * stageHeight,
  );
}

/**
 * Fillet tangent length for visual radius `r` at a corner whose two edges
 * leave the vertex along unit directions `a` and `b`: `d = r / tan(θ/2)`.
 * Acute corners (small θ) need longer tangents than obtuse ones for the same r.
 */
export function filletTangentLength(r: number, a: Pt, b: Pt): number {
  if (r <= 0) return 0;
  const theta = Math.acos(clamp(dot(a, b), -1, 1));
  const half = Math.tan(theta / 2);
  if (!(half > EPS)) return Number.POSITIVE_INFINITY;
  return r / half;
}

/**
 * Cubic fillet from `p0` (heading `u`) to `p1` (heading `v`). Handles lie on
 * the two tangent lines, so both joins are G1. For straight edges this is the
 * standard circular-arc approximation.
 */
function filletCubic(p0: Pt, u: Pt, p1: Pt, v: Pt): Cubic {
  const chord = sub(p1, p0);
  const det = cross(u, v);
  let lam: number;
  let mu: number;
  if (Math.abs(det) > EPS) {
    // p0 + λu = p1 − μv  →  λu + μv = chord
    lam = cross(chord, v) / det;
    mu = cross(u, chord) / det;
  } else {
    lam = mu = len(chord) / 2;
  }
  if (!(lam > 0) || !(mu > 0)) {
    lam = mu = len(chord) / 2;
  }
  const phi = Math.acos(clamp(dot(u, v), -1, 1)); // turning angle
  const k =
    phi > 1e-4 && phi < Math.PI - 1e-4
      ? ((4 / 3) * Math.tan(phi / 4)) / Math.tan(phi / 2)
      : 2 / 3;
  return {
    p0,
    c1: add(p0, mul(u, k * lam)),
    c2: sub(p1, mul(v, k * mu)),
    p3: p1,
    straight: false,
  };
}

export type RoundedStageSpec = {
  /** Horizontal center. */
  cx: number;
  /** Top edge y (rim endpoints). */
  y: number;
  topWidth: number;
  bottomWidth: number;
  height: number;
  cornerRadius: number;
  /** Radius of the two top corners. Default `cornerRadius`. */
  topCornerRadius?: number;
  /** Radius of the two bottom corners. Default `cornerRadius`. */
  bottomCornerRadius?: number;
  sideCurve?: number;
  /** Rim depth in px at the top edge (downward). */
  topSagitta?: number;
  /** Rim depth in px at the bottom edge (downward). */
  bottomSagitta?: number;
};

/** One closed stage outline: alternating edge / fillet segments. */
export type StageOutline = {
  segments: Array<Cubic & { role: "edge" | "corner" }>;
  /** Fillet tangent length actually used per corner (TR, BR, BL, TL). */
  tangentLengths: [number, number, number, number];
};

/**
 * Build a stage outline: four edges (top rim → right wall → bottom rim → left
 * wall, clockwise on screen) joined by fillets.
 */
export function roundedStageOutline(spec: RoundedStageSpec): StageOutline | null {
  const tw = Math.max(spec.topWidth, 0);
  const bw = Math.max(spec.bottomWidth, 0);
  const h = Math.max(spec.height, 0);
  if (h <= 0 || (tw <= 0 && bw <= 0)) return null;

  const { cx, y } = spec;
  const rTop = Math.max(spec.topCornerRadius ?? spec.cornerRadius, 0);
  const rBot = Math.max(spec.bottomCornerRadius ?? spec.cornerRadius, 0);
  // Corner k: 0 = TR, 1 = BR, 2 = BL, 3 = TL.
  const cornerR = [rTop, rBot, rBot, rTop];
  const curve = clamp(spec.sideCurve ?? DEFAULT_SIDE_CURVE, 0, 1);
  const sTop = Math.max(spec.topSagitta ?? 0, 0);
  const sBot = Math.max(spec.bottomSagitta ?? 0, 0);

  const TL = pt(cx - tw / 2, y);
  const TR = pt(cx + tw / 2, y);
  const BR = pt(cx + bw / 2, y + h);
  const BL = pt(cx - bw / 2, y + h);

  // Quadratic rim with control at depth 2s → curve midpoint at depth s.
  const rim = (a: Pt, b: Pt, baseY: number, s: number): Cubic =>
    cubicFromQuad(a, pt(cx, baseY + 2 * s), b, s <= 0);

  const wall = (a: Pt, b: Pt): Cubic => {
    const u = sub(b, a);
    const L = len(u);
    // Rotate 90° toward the stage interior (both walls: (−u.y, u.x)).
    const n = L > EPS ? pt(-u.y / L, u.x / L) : pt(0, 0);
    const bow = curve * SIDE_BOW_OVER_LENGTH * L;
    return {
      p0: a,
      c1: add(lerp(a, b, 1 / 3), mul(n, bow)),
      c2: add(lerp(a, b, 2 / 3), mul(n, bow)),
      p3: b,
      straight: bow <= 0,
    };
  };

  const edges: Cubic[] = [
    rim(TL, TR, y, sTop),
    wall(TR, BR),
    rim(BR, BL, y + h, sBot),
    wall(BL, TL),
  ];
  // Along-chord length; each edge is linear in t along its chord, so a trim
  // distance d maps to parameter d / length.
  const edgeLen = edges.map((e) => len(sub(e.p3, e.p0)));

  // Corner k joins edges[k] (ending at it) and edges[k+1] (starting at it).
  const tangentLengths = edges.map((e, k) => {
    const next = edges[(k + 1) % 4]!;
    const r = cornerR[k]!;
    const back = endTangent(e);
    const fwd = startTangent(next);
    if (!back || !fwd || r <= 0) return 0;
    const d = filletTangentLength(r, mul(back, -1), fwd);
    const cap = FILLET_MAX_EDGE_FRACTION * Math.min(edgeLen[k]!, edgeLen[(k + 1) % 4]!);
    return Math.max(0, Math.min(d, cap));
  }) as [number, number, number, number];

  const segments: StageOutline["segments"] = [];
  const trimmed = edges.map((e, k) => {
    const L = edgeLen[k]!;
    const dStart = tangentLengths[(k + 3) % 4]!;
    const dEnd = tangentLengths[k]!;
    const t0 = L > EPS ? dStart / L : 0;
    const t1 = L > EPS ? 1 - dEnd / L : 1;
    return subCubic(e, t0, Math.max(t0, t1));
  });

  for (let k = 0; k < 4; k++) {
    const e = trimmed[k]!;
    segments.push({ ...e, role: "edge" });
    const next = trimmed[(k + 1) % 4]!;
    if (len(sub(next.p0, e.p3)) <= 1e-6) continue;
    const u = endTangent(e) ?? endTangent(edges[k]!);
    const v = startTangent(next) ?? startTangent(edges[(k + 1) % 4]!);
    if (!u || !v) continue;
    segments.push({ ...filletCubic(e.p3, u, next.p0, v), role: "corner" });
  }

  return { segments, tangentLengths };
}

/** Serialize an outline to SVG path data (straight edges emit `L`). */
export function outlineToPath(outline: StageOutline): string {
  const first = outline.segments[0]!;
  const parts = [`M ${fmt(first.p0.x)} ${fmt(first.p0.y)}`];
  for (const s of outline.segments) {
    if (len(sub(s.p3, s.p0)) <= 1e-6) continue;
    if (s.straight) {
      parts.push(`L ${fmt(s.p3.x)} ${fmt(s.p3.y)}`);
    } else {
      parts.push(
        `C ${fmt(s.c1.x)} ${fmt(s.c1.y)} ${fmt(s.c2.x)} ${fmt(s.c2.y)} ${fmt(s.p3.x)} ${fmt(s.p3.y)}`,
      );
    }
  }
  parts.push("Z");
  return parts.join(" ");
}

/** Closed SVG path for one soft funnel stage. Empty when degenerate. */
export function roundedTrapezoidPath(spec: RoundedStageSpec): string {
  const outline = roundedStageOutline(spec);
  return outline ? outlineToPath(outline) : "";
}

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------

function parseMinSizeRatio(minSizeRatio: number | undefined): number {
  if (minSizeRatio == null || !Number.isFinite(minSizeRatio)) {
    return DEFAULT_MIN_SIZE_RATIO;
  }
  return clamp(minSizeRatio, 0, 1);
}

/**
 * Value→width schedule for rounded stages.
 *
 * Taper (default): top_i = scale(v_i), bottom_i = scale(v_{i+1}), last bottom =
 * minSize floor. Capsule: top_i = bottom_i = scale(v_i).
 */
export function computeStageEdgeWidths(
  values: number[],
  width: number,
  minSizeRatio: number,
  widthMode: RoundedWidthMode,
): StageEdgeWidths[] {
  const maxValue = Math.max(...values.map((v) => Math.max(0, v)), 1);
  const minW = width * minSizeRatio;
  const scale = (v: number) => minW + (width - minW) * (Math.max(0, v) / maxValue);
  const n = values.length;
  const edges: StageEdgeWidths[] = [];
  for (let i = 0; i < n; i++) {
    const top = scale(values[i]!);
    const bottom =
      widthMode === "capsule" ? top : i < n - 1 ? scale(values[i + 1]!) : minW;
    edges.push({ top, bottom });
  }
  return edges;
}

/** Layout equal-height soft funnel stages inside `width × height`. */
export function buildRoundedFunnelLayout(
  stages: RoundedStageInput[],
  opts: RoundedGeometryOptions,
): RoundedLayout {
  const stageCount = stages.length;
  const gap = Math.max(0, opts.gap ?? DEFAULT_GAP);
  const cornerRadius = Math.max(0, opts.cornerRadius ?? DEFAULT_CORNER_RADIUS);
  const innerCornerRadius = clamp(
    opts.innerCornerRadius ?? DEFAULT_INNER_CORNER_RADIUS,
    0,
    cornerRadius,
  );
  const sideCurve = clamp(opts.sideCurve ?? DEFAULT_SIDE_CURVE, 0, 1);
  const rimDepth = clamp(opts.rimDepth ?? 0, 0, MAX_RIM_DEPTH);
  const minRatio = parseMinSizeRatio(opts.minSizeRatio);
  const widthMode = opts.widthMode ?? DEFAULT_WIDTH_MODE;
  const width = Math.max(opts.width, 1);
  const height = Math.max(opts.height, 1);

  const base = {
    gap,
    cornerRadius,
    innerCornerRadius,
    sideCurve,
    rimDepth,
    widthMode,
  };
  if (stageCount === 0) {
    return {
      ...base,
      stagePaths: [],
      labelCenters: [],
      stageWidths: [],
      edgeWidths: [],
      rimSagittas: [],
      stageCount: 0,
      stageHeight: 0,
    };
  }

  const values = stages.map((s) => Math.max(0, s.value));
  const edgeWidths = computeStageEdgeWidths(values, width, minRatio, widthMode);

  // The last bottom rim bulges below its edge; reserve room so it stays inside.
  const reserve = rimDepth * edgeWidths[stageCount - 1]!.bottom;
  const totalGap = gap * (stageCount - 1);
  const stageHeight = Math.max((height - totalGap - reserve) / stageCount, 1);

  const cx = width / 2;
  const stagePaths: string[] = [];
  const labelCenters: Array<{ x: number; y: number }> = [];
  const stageWidths: number[] = [];
  const rimSagittas: StageEdgeWidths[] = [];

  for (let i = 0; i < stageCount; i++) {
    const { top, bottom } = edgeWidths[i]!;
    const y = i * (stageHeight + gap);
    const topSagitta = rimSagittaForEdge(top, rimDepth, stageHeight);
    const bottomSagitta = rimSagittaForEdge(bottom, rimDepth, stageHeight);
    stageWidths.push(top);
    rimSagittas.push({ top: topSagitta, bottom: bottomSagitta });
    stagePaths.push(
      roundedTrapezoidPath({
        cx,
        y,
        topWidth: top,
        bottomWidth: bottom,
        height: stageHeight,
        cornerRadius,
        // Outer corners only at the funnel's top and bottom; gaps get inner.
        topCornerRadius: i === 0 ? cornerRadius : innerCornerRadius,
        bottomCornerRadius: i === stageCount - 1 ? cornerRadius : innerCornerRadius,
        sideCurve,
        topSagitta,
        bottomSagitta,
      }),
    );
    // Both rims dip by their depth at the center line.
    labelCenters.push({
      x: cx,
      y: y + (topSagitta + stageHeight + bottomSagitta) / 2,
    });
  }

  return {
    ...base,
    stagePaths,
    labelCenters,
    stageWidths,
    edgeWidths,
    rimSagittas,
    stageCount,
    stageHeight,
  };
}
