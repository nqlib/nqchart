/**
 * Pipe-funnel silhouette geometry (horizontal or vertical).
 *
 * Design:
 * - Radius lives ONLY at joins between levels (S-curves with flow-parallel
 *   tangents — C1 with the flats).
 * - Outer start/end faces are square by default (no stadium end-caps).
 * - Optional `capRadius` restores rounded termini if a consumer wants them.
 */

export type PipeOrient = "horizontal" | "vertical";

export type PipeStageInput = {
  value: number;
};

export type PipeGeometryOptions = {
  width: number;
  height: number;
  orient?: PipeOrient;
  /**
   * Half-width of the join zone in px along the flow axis.
   * When omitted, uses a tight fillet (~8% of a stage, capped at 10px full width).
   */
  turnRadius?: number;
  /**
   * Rounded start/end termini in px. Default `0` — square ends; radius only
   * at inter-level joins.
   */
  capRadius?: number;
};

export type PipeLayout = {
  pathData: string;
  stagePaths: string[];
  /** Stage span along the flow axis (column width or row height). */
  stageSpan: number;
  /** @deprecated alias of stageSpan — kept for older call sites/tests. */
  stageWidth: number;
  stageCount: number;
  /** Inset from the cross-axis origin to the near edge of each stage flat. */
  stageInset: number[];
  stageThickness: number[];
  orient: PipeOrient;
};

/**
 * Default full join width as a fraction of one stage span.
 * Keep this small — radius should read as a fillet at the boundary, not a
 * long shoulder into the previous level (left on H / up on V).
 */
const DEFAULT_TRANSITION_RATIO = 0.08;
/** Hard cap on default join width so short vertical stages stay mostly flat. */
const DEFAULT_TRANSITION_MAX_PX = 10;
/** Never let an explicit turnRadius eat most of a stage. */
const MAX_TRANSITION_RATIO = 0.32;

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

/**
 * Join window around a stage boundary. Bias slightly downstream so the
 * previous level stays flat until near the edge (avoids “shoulder left/up”).
 * `upstreamShare` of the transition sits before the boundary.
 */
const JOIN_UPSTREAM_SHARE = 0.35;

function joinWindow(
  boundary: number,
  transition: number,
): { a: number; b: number } {
  const before = transition * JOIN_UPSTREAM_SHARE;
  const after = transition - before;
  return { a: boundary - before, b: boundary + after };
}

/** Cubic Bezier on the cross-axis with tangents parallel to flow. */
function cubicCross(
  a: number,
  c0: number,
  b: number,
  c1: number,
  flow: number,
): number {
  const t = b - a;
  if (t <= 0) return c1;
  const u = clamp((flow - a) / t, 0, 1);
  const mu = 1 - u;
  return mu * mu * mu * c0 + 3 * mu * mu * u * c0 + 3 * mu * u * u * c1 + u * u * u * c1;
}

function insetAt(
  flow: number,
  insets: number[],
  span: number,
  transition: number,
  flowLen: number,
): number {
  const n = insets.length;
  if (n === 0) return 0;
  if (flow <= 0) return insets[0]!;
  if (flow >= flowLen) return insets[n - 1]!;

  for (let i = 0; i < n - 1; i++) {
    const boundary = (i + 1) * span;
    const { a, b } = joinWindow(boundary, transition);
    if (flow >= a && flow <= b) {
      return cubicCross(a, insets[i]!, b, insets[i + 1]!, flow);
    }
  }

  const i = Math.min(Math.floor(flow / span), n - 1);
  return insets[i]!;
}

function toXY(
  flow: number,
  cross: number,
  orient: PipeOrient,
): { x: number; y: number } {
  return orient === "horizontal" ? { x: flow, y: cross } : { x: cross, y: flow };
}

function pathPoint(flow: number, cross: number, orient: PipeOrient): string {
  const { x, y } = toXY(flow, cross, orient);
  return `${x} ${y}`;
}

/** Square or rounded close of the far end of the ribbon. */
function appendEndFace(
  parts: string[],
  flowLen: number,
  insetLast: number,
  farLast: number,
  endCap: number,
  orient: PipeOrient,
): void {
  if (endCap <= 0) {
    parts.push(`L ${pathPoint(flowLen, insetLast, orient)}`);
    parts.push(`L ${pathPoint(flowLen, farLast, orient)}`);
    return;
  }
  const midNear = toXY(flowLen, insetLast + endCap, orient);
  const farEnd = toXY(flowLen, farLast - endCap, orient);
  const farJoin = toXY(flowLen - endCap, farLast, orient);
  parts.push(`L ${pathPoint(flowLen - endCap, insetLast, orient)}`);
  parts.push(`A ${endCap} ${endCap} 0 0 1 ${midNear.x} ${midNear.y}`);
  parts.push(`L ${farEnd.x} ${farEnd.y}`);
  parts.push(`A ${endCap} ${endCap} 0 0 1 ${farJoin.x} ${farJoin.y}`);
}

/** Square or rounded close of the start end of the ribbon (far → near). */
function appendStartFace(
  parts: string[],
  inset0: number,
  far0: number,
  startCap: number,
  orient: PipeOrient,
): void {
  if (startCap <= 0) {
    parts.push(`L ${pathPoint(0, far0, orient)}`);
    parts.push(`L ${pathPoint(0, inset0, orient)}`);
    return;
  }
  const midFar = toXY(0, far0 - startCap, orient);
  const midNear = toXY(0, inset0 + startCap, orient);
  const start = toXY(startCap, inset0, orient);
  parts.push(`L ${pathPoint(startCap, far0, orient)}`);
  parts.push(`A ${startCap} ${startCap} 0 0 1 ${midFar.x} ${midFar.y}`);
  parts.push(`L ${midNear.x} ${midNear.y}`);
  parts.push(`A ${startCap} ${startCap} 0 0 1 ${start.x} ${start.y}`);
}

/** Build the full pipe silhouette + per-stage closed paths. */
export function buildPipeLayout(
  stages: PipeStageInput[],
  opts: PipeGeometryOptions,
): PipeLayout {
  const n = stages.length;
  const width = opts.width;
  const height = opts.height;
  const orient: PipeOrient = opts.orient ?? "horizontal";

  const empty: PipeLayout = {
    pathData: "",
    stagePaths: [],
    stageSpan: 0,
    stageWidth: 0,
    stageCount: 0,
    stageInset: [],
    stageThickness: [],
    orient,
  };

  if (n === 0 || width <= 0 || height <= 0) return empty;

  const flowLen = orient === "horizontal" ? width : height;
  const crossLen = orient === "horizontal" ? height : width;
  const span = flowLen / n;
  const max = Math.max(...stages.map((s) => s.value), 0) || 1;
  // Square ends by default — do not reserve cross-axis space for caps.
  const capBase = Math.max(0, opts.capRadius ?? 0);
  const usable = Math.max(crossLen, 1);

  const thickness = stages.map((s) => (s.value / max) * usable);
  const inset = thickness.map((th) => (crossLen - th) / 2);
  const far = inset.map((inn, i) => crossLen - inn);

  const transition =
    opts.turnRadius != null
      ? clamp(opts.turnRadius * 2, 3, span * MAX_TRANSITION_RATIO)
      : Math.min(span * DEFAULT_TRANSITION_RATIO, DEFAULT_TRANSITION_MAX_PX);

  const startCap = Math.min(capBase, thickness[0]! / 2);
  const endCap = Math.min(capBase, thickness[n - 1]! / 2);

  const d: string[] = [];
  // Near edge, flow start → end, with S-curves only at level joins.
  d.push(`M ${pathPoint(0, inset[0]!, orient)}`);
  for (let i = 0; i < n - 1; i++) {
    const boundary = (i + 1) * span;
    const { a, b } = joinWindow(boundary, transition);
    const mid = (a + b) / 2;
    d.push(`L ${pathPoint(a, inset[i]!, orient)}`);
    const c1 = toXY(mid, inset[i]!, orient);
    const c2 = toXY(mid, inset[i + 1]!, orient);
    const end = toXY(b, inset[i + 1]!, orient);
    d.push(`C ${c1.x} ${c1.y} ${c2.x} ${c2.y} ${end.x} ${end.y}`);
  }
  appendEndFace(d, flowLen, inset[n - 1]!, far[n - 1]!, endCap, orient);

  for (let i = n - 2; i >= 0; i--) {
    const boundary = (i + 1) * span;
    const { a, b } = joinWindow(boundary, transition);
    const mid = (a + b) / 2;
    d.push(`L ${pathPoint(b, far[i + 1]!, orient)}`);
    const c1 = toXY(mid, far[i + 1]!, orient);
    const c2 = toXY(mid, far[i]!, orient);
    const end = toXY(a, far[i]!, orient);
    d.push(`C ${c1.x} ${c1.y} ${c2.x} ${c2.y} ${end.x} ${end.y}`);
  }
  appendStartFace(d, inset[0]!, far[0]!, startCap, orient);
  d.push("Z");

  const samples = Math.max(10, Math.ceil(span / 3));
  const stagePaths = stages.map((_, i) => {
    const f0 = i * span;
    const f1 = (i + 1) * span;
    const flows: number[] = [];
    for (let s = 0; s <= samples; s++) {
      flows.push(f0 + ((f1 - f0) * s) / samples);
    }

    const nearPts = flows.map((f) => {
      const c = insetAt(f, inset, span, transition, flowLen);
      return toXY(f, c, orient);
    });
    const farPts = flows
      .slice()
      .reverse()
      .map((f) => {
        const c = crossLen - insetAt(f, inset, span, transition, flowLen);
        return toXY(f, c, orient);
      });

    const parts: string[] = [`M ${nearPts[0]!.x} ${nearPts[0]!.y}`];
    for (let p = 1; p < nearPts.length; p++) {
      parts.push(`L ${nearPts[p]!.x} ${nearPts[p]!.y}`);
    }

    if (i === n - 1) {
      appendEndFace(parts, flowLen, inset[n - 1]!, far[n - 1]!, endCap, orient);
    }

    for (const p of farPts) {
      parts.push(`L ${p.x} ${p.y}`);
    }

    if (i === 0) {
      appendStartFace(parts, inset[0]!, far[0]!, startCap, orient);
    }

    parts.push("Z");
    return parts.join(" ");
  });

  return {
    pathData: d.join(" "),
    stagePaths,
    stageSpan: span,
    stageWidth: span,
    stageCount: n,
    stageInset: inset,
    stageThickness: thickness,
    orient,
  };
}
