/**
 * Render a compiled option to an SVG string in Node, with no browser.
 *
 * ECharts 5.3+ server-side rendering: `init(null, …, { renderer: "svg", ssr: true })`
 * and `renderToSVGString()`. The SVG renderer lives in this entry only; the browser
 * entries keep `CanvasRenderer` (plan 016).
 */
import type { EChartsOption } from "echarts";
import { BarChart, CustomChart, LineChart, PieChart } from "echarts/charts";
import {
  DataZoomComponent,
  GridComponent,
  LegendComponent,
  MarkAreaComponent,
  MarkLineComponent,
} from "echarts/components";
import * as echarts from "echarts/core";
import { SVGRenderer } from "echarts/renderers";

/** Modules every headless render needs: the SVG renderer, the cartesian and pie families, reference marks. */
const HEADLESS_MODULES = [
  SVGRenderer,
  GridComponent,
  LegendComponent,
  MarkLineComponent,
  MarkAreaComponent,
  DataZoomComponent,
  BarChart,
  LineChart,
  PieChart,
  CustomChart,
] as const;

const registered = new Set<unknown>();

/**
 * Register the modules, once each, by module identity.
 *
 * MUST be called, not merely imported: this package declares `"sideEffects": false`,
 * so a top-level `echarts.use([...])` would be tree-shaken away (see `getEcharts` in
 * `echarts-init.ts`).
 */
function registerOnce(modules: readonly unknown[]): void {
  if (modules.every((mod) => registered.has(mod))) return;
  echarts.use(modules as Parameters<typeof echarts.use>[0]);
  for (const mod of modules) registered.add(mod);
}

export type RenderToSvgOptions = {
  /** The SVG width in CSS px. */
  width: number;
  /** The SVG height in CSS px. */
  height: number;
  /** More ECharts modules for a family outside the default set (e.g. `GaugeChart`). */
  modules?: readonly unknown[];
};

/**
 * Draw `option` to an SVG string at `width` × `height`.
 *
 * Animation and the tooltip are off: an image has no frames and no pointer. The
 * option's `backgroundColor` stays as compiled (`transparent`); the consumer paints
 * its own page.
 */
export function renderToSvg(option: EChartsOption, opts: RenderToSvgOptions): string {
  registerOnce([...HEADLESS_MODULES, ...(opts.modules ?? [])]);
  const chart = echarts.init(null, undefined, {
    renderer: "svg",
    ssr: true,
    width: opts.width,
    height: opts.height,
  });
  try {
    // The tooltip component is not registered (it builds DOM content); drop the key
    // so ECharts does not ask for it.
    const { tooltip: _tooltip, ...rest } = option;
    void _tooltip;
    chart.setOption({ ...rest, animation: false });
    return chart.renderToSVGString();
  } finally {
    chart.dispose();
  }
}
