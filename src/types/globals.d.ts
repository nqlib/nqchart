declare module "*.css";

declare module "echarts/lib/animation/basicTransition.js" {
  export function initProps(
    el: { animators?: unknown[] },
    props: Record<string, unknown>,
    animatableModel: unknown,
    dataIndex?: unknown,
    cb?: () => void,
  ): void;
}

declare module "echarts/lib/util/graphic.js" {
  export class Rect {
    constructor(opts?: { shape?: Record<string, number> });
    animators?: unknown[];
  }
}
