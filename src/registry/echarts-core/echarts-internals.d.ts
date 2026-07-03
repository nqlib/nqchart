declare module "echarts/lib/util/states.js" {
  export function enterBlur(el: unknown): void;
  export function enterEmphasis(el: unknown, highlightDigit?: number): void;
  export function leaveBlur(el: unknown): void;
  export function leaveEmphasis(el: unknown, highlightDigit?: number): void;
}

declare module "echarts/lib/animation/basicTransition.js" {
  export function initProps(
    el: unknown,
    props: Record<string, unknown>,
    animatableModel?: unknown,
    dataIndex?: number | (() => void),
    cb?: () => void,
  ): void;
}

declare module "echarts/lib/util/graphic.js" {
  export class Rect {
    constructor(opts?: Record<string, unknown>);
    [key: string]: unknown;
  }
}
