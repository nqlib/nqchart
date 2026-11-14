/** Shared isometric projection for the 3D showcase specimens. */

export const ISO = { dx: 10, dy: 7 } as const;

export const ISO_VIEW = { w: 640, h: 280, top: 20, right: 28, bottom: 32, left: 16 } as const;

export const ISO_MONTHS = [
  { month: "Jan", desktop: 42, mobile: 28 },
  { month: "Feb", desktop: 55, mobile: 36 },
  { month: "Mar", desktop: 38, mobile: 44 },
  { month: "Apr", desktop: 61, mobile: 40 },
  { month: "May", desktop: 48, mobile: 52 },
  { month: "Jun", desktop: 70, mobile: 46 },
] as const;

export type IsoMonth = (typeof ISO_MONTHS)[number];

export function isoPlot() {
  const v = ISO_VIEW;
  return {
    x: v.left,
    y: v.top,
    w: v.w - v.left - v.right,
    h: v.h - v.top - v.bottom,
  };
}

export function prismSide(x: number, y: number, width: number, height: number) {
  const { dx, dy } = ISO;
  return `${x + width},${y} ${x + width + dx},${y - dy} ${x + width + dx},${y + height - dy} ${x + width},${y + height}`;
}

export function prismTop(x: number, y: number, width: number) {
  const { dx, dy } = ISO;
  return `${x},${y} ${x + width},${y} ${x + width + dx},${y - dy} ${x + dx},${y - dy}`;
}

/** Fritsch–Carlson monotone cubic, sampled between the given points. */
export function sampleMonotone(points: { x: number; y: number }[], steps = 8) {
  const n = points.length;
  if (n < 2) return points.slice();
  const slope = new Array<number>(n).fill(0);
  slope[0] = (points[1]!.y - points[0]!.y) / (points[1]!.x - points[0]!.x);
  slope[n - 1] = (points[n - 1]!.y - points[n - 2]!.y) / (points[n - 1]!.x - points[n - 2]!.x);
  for (let i = 1; i < n - 1; i++) {
    slope[i] = (points[i + 1]!.y - points[i - 1]!.y) / (points[i + 1]!.x - points[i - 1]!.x);
  }
  for (let i = 0; i < n - 1; i++) {
    const h = points[i + 1]!.x - points[i]!.x;
    const delta = (points[i + 1]!.y - points[i]!.y) / h;
    if (delta === 0) {
      slope[i] = 0;
      slope[i + 1] = 0;
      continue;
    }
    const a = slope[i]! / delta;
    const b = slope[i + 1]! / delta;
    const s = a * a + b * b;
    if (s > 9) {
      const t = 3 / Math.sqrt(s);
      slope[i] = t * a * delta;
      slope[i + 1] = t * b * delta;
    }
  }
  const out: { x: number; y: number }[] = [];
  for (let i = 0; i < n - 1; i++) {
    const h = points[i + 1]!.x - points[i]!.x;
    for (let s = 0; s < steps; s++) {
      const t = s / steps;
      const t2 = t * t;
      const t3 = t2 * t;
      out.push({
        x: points[i]!.x + t * h,
        y:
          (2 * t3 - 3 * t2 + 1) * points[i]!.y +
          (t3 - 2 * t2 + t) * h * slope[i]! +
          (-2 * t3 + 3 * t2) * points[i + 1]!.y +
          (t3 - t2) * h * slope[i + 1]!,
      });
    }
  }
  out.push(points[n - 1]!);
  return out;
}

export function ribbonPoints(front: { x: number; y: number }[], dx: number, dy: number) {
  const back = front.map((p) => ({ x: p.x + dx, y: p.y - dy }));
  return [...front, ...back.reverse()].map((p) => `${p.x},${p.y}`).join(" ");
}
