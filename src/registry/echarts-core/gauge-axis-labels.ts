import { CHART_FONT_SIZE } from "./chart-typography-tokens";

/** Default gauge split count (ECharts gauge default). */
export const GAUGE_SPLIT_NUMBER = 10;

/** Assumed card size when viewport is unknown (SSR / first paint / unit tests). */
const DEFAULT_VIEWPORT = { width: 320, height: 240 };

/** Prefer denser labels; shrink type a notch before thinning. */
const FONT_CANDIDATES = [
  CHART_FONT_SIZE.base,
  CHART_FONT_SIZE.small,
  CHART_FONT_SIZE.micro,
] as const;

const STRIDE_CANDIDATES = [1, 2, 4] as const;

export type GaugeLabelLayoutInput = {
  width?: number;
  height?: number;
  /** Sweep of the dial in degrees (180 = semi). */
  sweepDeg?: number;
  splitNumber?: number;
  min?: number;
  max?: number;
  /** ECharts `radius` as a fraction of half the short side (default 0.75). */
  radiusRatio?: number;
  /** ECharts `axisLabel.distance` (default 15). */
  labelDistance?: number;
  /** ECharts `splitLine.length` (default 10). */
  splitLineLength?: number;
};

export type GaugeLabelLayout = {
  /** `1` = every tick; `2` = alternate; `4` = every fourth. */
  stride: 1 | 2 | 4;
  fontSize: number;
};

type LabelBox = { x: number; y: number; w: number; h: number };

function estimateLabelWidth(text: string, fontSize: number): number {
  // Inter/canvas digits read wider than a pure mono 0.5em; bias high so we
  // thin/shrink before the eye sees a pile-up on the crown.
  return Math.max(1, text.length) * fontSize * 0.78;
}

function boxesOverlap(a: LabelBox, b: LabelBox, pad: number): boolean {
  return !(
    a.x + a.w / 2 + pad <= b.x - b.w / 2 ||
    b.x + b.w / 2 + pad <= a.x - a.w / 2 ||
    a.y + a.h / 2 + pad <= b.y - b.h / 2 ||
    b.y + b.h / 2 + pad <= a.y - a.h / 2
  );
}

function visibleTickIndices(splitNumber: number, stride: number): number[] {
  const out: number[] = [];
  for (let i = 0; i <= splitNumber; i++) {
    if (i === 0 || i === splitNumber || stride <= 1 || i % stride === 0) {
      out.push(i);
    }
  }
  return out;
}

/**
 * Axis-aligned boxes for horizontal gauge labels (rotate: 0) along the dial.
 * Collision here matches what the eye sees better than pure arc-length checks —
 * neighbors near the crown share similar Y and collide on X first.
 */
export function gaugeLabelsCollide(input: {
  width: number;
  height: number;
  min: number;
  max: number;
  splitNumber: number;
  stride: number;
  fontSize: number;
  sweepDeg: number;
  radiusRatio: number;
  labelDistance: number;
  splitLineLength: number;
}): boolean {
  const {
    width,
    height,
    min,
    max,
    splitNumber,
    stride,
    fontSize,
    sweepDeg,
    radiusRatio,
    labelDistance,
    splitLineLength,
  } = input;

  const short = Math.min(width, height);
  const r = radiusRatio * (short / 2);
  const labelR = Math.max(8, r - splitLineLength - labelDistance);
  const cx = width / 2;
  const cy = height / 2;
  const span = max - min;
  // Air gap between glyph boxes — crown neighbors share nearly the same Y.
  const pad = fontSize * 0.45;
  const indices = visibleTickIndices(splitNumber, stride);
  const boxes: LabelBox[] = [];

  for (const i of indices) {
    const t = i / splitNumber;
    // NQ gauges: startAngle 180 → endAngle 0 (top semicircle).
    const angleRad = ((180 - t * sweepDeg) * Math.PI) / 180;
    const value = min + span * t;
    const text = String(Math.round(value));
    boxes.push({
      x: cx + Math.cos(angleRad) * labelR,
      y: cy - Math.sin(angleRad) * labelR,
      w: estimateLabelWidth(text, fontSize),
      h: fontSize * 1.15,
    });
  }

  for (let a = 0; a < boxes.length; a++) {
    for (let b = a + 1; b < boxes.length; b++) {
      if (boxesOverlap(boxes[a]!, boxes[b]!, pad)) return true;
    }
  }
  return false;
}

/**
 * Pick the densest label layout that does not collide: try smaller fonts at the
 * current stride before jumping to every-other / every-fourth ticks.
 */
export function resolveGaugeLabelLayout(input: GaugeLabelLayoutInput = {}): GaugeLabelLayout {
  const width = input.width ?? DEFAULT_VIEWPORT.width;
  const height = input.height ?? DEFAULT_VIEWPORT.height;
  const splitNumber = input.splitNumber ?? GAUGE_SPLIT_NUMBER;
  const sweepDeg = input.sweepDeg ?? 180;
  const radiusRatio = input.radiusRatio ?? 0.75;
  const labelDistance = input.labelDistance ?? 15;
  const splitLineLength = input.splitLineLength ?? 10;
  const min = input.min ?? 0;
  const max = input.max ?? 100;

  if (width <= 0 || height <= 0 || splitNumber <= 0) {
    return { stride: 2, fontSize: CHART_FONT_SIZE.small };
  }

  for (const stride of STRIDE_CANDIDATES) {
    for (const fontSize of FONT_CANDIDATES) {
      const collides = gaugeLabelsCollide({
        width,
        height,
        min,
        max,
        splitNumber,
        stride,
        fontSize,
        sweepDeg,
        radiusRatio,
        labelDistance,
        splitLineLength,
      });
      if (!collides) return { stride, fontSize };
    }
  }

  return { stride: 4, fontSize: CHART_FONT_SIZE.micro };
}

/** @deprecated Prefer {@link resolveGaugeLabelLayout}. */
export function resolveGaugeLabelStride(
  input: GaugeLabelLayoutInput & { fontSize?: number } = {},
): 1 | 2 | 4 {
  return resolveGaugeLabelLayout(input).stride;
}

/**
 * Show label at index 0 / last always; otherwise every `stride` tick.
 * Odd (or non-multiple) ticks return `""` so the glyph is omitted.
 */
export function formatGaugeAxisLabel(
  value: number,
  opts: { min: number; max: number; splitNumber: number; stride: number },
): string {
  const { min, max, splitNumber, stride } = opts;
  const span = max - min;
  if (!(span > 0) || splitNumber <= 0) return String(value);

  const index = Math.round(((value - min) / span) * splitNumber);
  if (index === 0 || index === splitNumber) return String(value);
  if (stride <= 1) return String(value);
  if (index % stride !== 0) return "";
  return String(value);
}
