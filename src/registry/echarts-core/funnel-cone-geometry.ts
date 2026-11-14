/**
 * 3D cone-funnel stage geometry (`connection="cone"`).
 *
 * Each stage is a frustum (truncated cone) seen slightly from above:
 * - Rims are ellipses with `ry = tilt · rx`, so every rim has the same
 *   proportions at any width (the same perspective as the flat rounded rims).
 * - Side walls are the exact outer tangents of the top and bottom ellipses, so
 *   wall and rim meet smoothly without a fillet. Scaling y by `1/tilt` turns both
 *   ellipses into circles; their outer tangent touches each at angle α below
 *   the horizontal, with `sin α = (r_top − r_bottom) · tilt / h`.
 * - The front face runs: left wall down → front half of the bottom ellipse →
 *   right wall up → front half of the top ellipse. The cap is the full top
 *   ellipse, drawn over it.
 *
 * Paint stages bottom-up (higher z for upper stages) so each slice hides the
 * back of the cap below it. Shading is the renderer's job — this module only
 * returns shapes.
 */

import { CHART_SIGNATURE } from "./chart-signature";
import {
  computeStageEdgeWidths,
  type RoundedStageInput,
  type RoundedWidthMode,
  type StageEdgeWidths,
} from "./funnel-rounded-geometry";

export type ConeGeometryOptions = {
  width: number;
  height: number;
  /** Vertical gap between stages in px (between rim center lines). */
  gap?: number;
  /** Rim ellipse height / width ratio (`ry = tilt · rx`). 0 = flat side view. */
  tilt?: number;
  /** Floor width as a fraction of `width` (0–1). */
  minSizeRatio?: number;
  /** Width model. Default `"taper"` (bottom_i === top_{i+1}). */
  widthMode?: RoundedWidthMode;
};

export type ConeEllipse = { cx: number; cy: number; rx: number; ry: number };
type Pt = { x: number; y: number };

export type ConeStage = {
  /** Visible outer surface (walls + front arcs). */
  bodyPath: string;
  /** Full top ellipse — the slice's top face / opening. */
  capPath: string;
  cap: ConeEllipse;
  bottom: ConeEllipse;
  /** Where each wall touches the rims. */
  tangents: { topLeft: Pt; topRight: Pt; bottomLeft: Pt; bottomRight: Pt };
  /** Middle of the front face on the center line — for labels. */
  labelCenter: Pt;
};

export type ConeLayout = {
  stages: ConeStage[];
  edgeWidths: StageEdgeWidths[];
  stageCount: number;
  stageHeight: number;
  gap: number;
  tilt: number;
  widthMode: RoundedWidthMode;
};

export const DEFAULT_CONE_TILT = 0.18;
export const MAX_CONE_TILT = 0.5;
const DEFAULT_GAP = CHART_SIGNATURE.gap.stage;
const DEFAULT_MIN_SIZE_RATIO = 0.12;
/**
 * When a stage is too short for its width change, the small rim would sit
 * inside the big one and no outer tangent exists; clamp α just short of 90°.
 */
const MAX_TANGENT_SIN = 0.98;
const EPS = 1e-6;

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

function fmt(n: number): string {
  return String(Math.round(n * 100) / 100 + 0);
}

/** SVG arc to `to` on ellipse `e`, or a straight line when the ellipse is flat. */
function arcTo(e: ConeEllipse, to: Pt, sweep: 0 | 1, large: 0 | 1 = 0): string {
  if (e.rx <= EPS || e.ry <= EPS) return `L ${fmt(to.x)} ${fmt(to.y)}`;
  return `A ${fmt(e.rx)} ${fmt(e.ry)} 0 ${large} ${sweep} ${fmt(to.x)} ${fmt(to.y)}`;
}

/** Closed path for a full ellipse (two half arcs). */
export function ellipsePath(e: ConeEllipse): string {
  const l = { x: e.cx - e.rx, y: e.cy };
  const r = { x: e.cx + e.rx, y: e.cy };
  return `M ${fmt(l.x)} ${fmt(l.y)} ${arcTo(e, r, 0, 1)} ${arcTo(e, l, 0, 1)} Z`;
}

/**
 * Outer-tangent angle of a frustum wall: `sin α` and `cos α` where α is how far
 * below each rim's horizontal extreme the wall touches it.
 */
export function coneWallTangent(
  topRadius: number,
  bottomRadius: number,
  tilt: number,
  height: number,
): { sin: number; cos: number } {
  const raw = height > 0 ? ((topRadius - bottomRadius) * tilt) / height : 0;
  const sin = clamp(raw, -MAX_TANGENT_SIN, MAX_TANGENT_SIN);
  return { sin, cos: Math.sqrt(1 - sin * sin) };
}

/** One frustum stage with top rim centered at `(cx, y)`. */
export function coneStage(
  cx: number,
  y: number,
  height: number,
  topWidth: number,
  bottomWidth: number,
  tilt: number,
): ConeStage {
  const r1 = Math.max(topWidth, 0) / 2;
  const r2 = Math.max(bottomWidth, 0) / 2;
  const h = Math.max(height, 0);
  const t = clamp(tilt, 0, MAX_CONE_TILT);
  const cap: ConeEllipse = { cx, cy: y, rx: r1, ry: r1 * t };
  const bottom: ConeEllipse = { cx, cy: y + h, rx: r2, ry: r2 * t };
  const { sin, cos } = coneWallTangent(r1, r2, t, h);

  const topLeft = { x: cx - r1 * cos, y: cap.cy + cap.ry * sin };
  const topRight = { x: cx + r1 * cos, y: cap.cy + cap.ry * sin };
  const bottomLeft = { x: cx - r2 * cos, y: bottom.cy + bottom.ry * sin };
  const bottomRight = { x: cx + r2 * cos, y: bottom.cy + bottom.ry * sin };

  // Front arcs pass through the lowest point of each ellipse (sweep 0 going
  // left→right along the bottom rim, sweep 1 going right→left along the top).
  const bodyPath = [
    `M ${fmt(topLeft.x)} ${fmt(topLeft.y)}`,
    `L ${fmt(bottomLeft.x)} ${fmt(bottomLeft.y)}`,
    r2 > EPS ? arcTo(bottom, bottomRight, 0) : "",
    `L ${fmt(topRight.x)} ${fmt(topRight.y)}`,
    arcTo(cap, topLeft, 1),
    "Z",
  ]
    .filter(Boolean)
    .join(" ");

  return {
    bodyPath,
    capPath: ellipsePath(cap),
    cap,
    bottom,
    tangents: { topLeft, topRight, bottomLeft, bottomRight },
    labelCenter: { x: cx, y: (cap.cy + cap.ry + bottom.cy + bottom.ry) / 2 },
  };
}

/**
 * Lay out equal-height cone stages inside `width × height`. Room is reserved
 * above for the back of the first rim and below for the front of the last.
 */
export function buildConeFunnelLayout(
  stages: RoundedStageInput[],
  opts: ConeGeometryOptions,
): ConeLayout {
  const stageCount = stages.length;
  const gap = Math.max(0, opts.gap ?? DEFAULT_GAP);
  const tilt = clamp(opts.tilt ?? DEFAULT_CONE_TILT, 0, MAX_CONE_TILT);
  const widthMode = opts.widthMode ?? "taper";
  const minSizeRatio =
    opts.minSizeRatio != null && Number.isFinite(opts.minSizeRatio)
      ? clamp(opts.minSizeRatio, 0, 1)
      : DEFAULT_MIN_SIZE_RATIO;
  const width = Math.max(opts.width, 1);
  const height = Math.max(opts.height, 1);

  if (stageCount === 0) {
    return { stages: [], edgeWidths: [], stageCount: 0, stageHeight: 0, gap, tilt, widthMode };
  }

  const edgeWidths = computeStageEdgeWidths(
    stages.map((s) => Math.max(0, s.value)),
    width,
    minSizeRatio,
    widthMode,
  );
  const reserveTop = (edgeWidths[0]!.top / 2) * tilt;
  const reserveBottom = (edgeWidths[stageCount - 1]!.bottom / 2) * tilt;
  const stageHeight = Math.max(
    (height - reserveTop - reserveBottom - gap * (stageCount - 1)) / stageCount,
    1,
  );

  const cx = width / 2;
  const out = edgeWidths.map((e, i) =>
    coneStage(cx, reserveTop + i * (stageHeight + gap), stageHeight, e.top, e.bottom, tilt),
  );

  return { stages: out, edgeWidths, stageCount, stageHeight, gap, tilt, widthMode };
}
