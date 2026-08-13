import * as echarts from "echarts/core";
import {
  GridComponent,
  LegendComponent,
  TooltipComponent,
} from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";

/** Modules every family needs. Chart types and specialty components are extras. */
const BASE = [
  CanvasRenderer,
  GridComponent,
  TooltipComponent,
  LegendComponent,
] as const;

const registered = new Set<unknown>();

export type EChartsExtraModules = readonly unknown[];

/**
 * Register the ECharts modules NQChart needs, then return the `echarts` namespace.
 *
 * MUST be called — not merely imported — before `echarts.init`. Registration is a
 * side effect, and this package declares `"sideEffects": false`, so a bare top-level
 * `echarts.use([...])` inside a re-export-only module gets tree-shaken away. That
 * leaves the canvas renderer unregistered and makes `init` throw
 * `Renderer 'undefined' is not imported`. Exposing it as a called function keeps the
 * registration in the bundle.
 *
 * Pass per-family extras so a bar-chart entry does not pull GaugeChart / TreemapChart.
 * `echarts.use` is idempotent. The guard is by **module identity**, not a stringified
 * extra-set: pie (`[PieChart]`) and line (`[LineChart]`) would otherwise collide on
 * the same key and the later family would never register. `getEcharts()` with no
 * argument still registers BASE.
 */
export function getEcharts(extra: EChartsExtraModules = []): typeof echarts {
  const bundle = [...BASE, ...extra];
  if (bundle.some((mod) => !registered.has(mod))) {
    echarts.use(bundle as Parameters<typeof echarts.use>[0]);
    for (const mod of bundle) registered.add(mod);
  }
  return echarts;
}
