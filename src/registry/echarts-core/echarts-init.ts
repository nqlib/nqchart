import * as echarts from "echarts/core";
import {
  BarChart,
  CustomChart,
  FunnelChart,
  GaugeChart,
  HeatmapChart,
  LineChart,
  PieChart,
  RadarChart,
  ScatterChart,
  TreemapChart,
} from "echarts/charts";
import {
  CalendarComponent,
  DataZoomComponent,
  GraphicComponent,
  GridComponent,
  LegendComponent,
  PolarComponent,
  RadarComponent,
  TooltipComponent,
  VisualMapComponent,
} from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";

let registered = false;

/**
 * Register every ECharts module NQChart uses (charts, components, canvas renderer)
 * exactly once, then return the configured `echarts` namespace.
 *
 * MUST be called — not merely imported — before `echarts.init`. Registration is a
 * side effect, and this package declares `"sideEffects": false`, so a bare top-level
 * `echarts.use([...])` inside a re-export-only module gets tree-shaken away. That
 * leaves the canvas renderer unregistered and makes `init` throw
 * `Renderer 'undefined' is not imported`. Exposing it as a called function keeps the
 * registration in the bundle.
 */
export function getEcharts(): typeof echarts {
  if (!registered) {
    echarts.use([
      BarChart,
      CustomChart,
      LineChart,
      PieChart,
      HeatmapChart,
      GaugeChart,
      RadarChart,
      ScatterChart,
      TreemapChart,
      FunnelChart,
      CalendarComponent,
      GraphicComponent,
      GridComponent,
      TooltipComponent,
      LegendComponent,
      VisualMapComponent,
      DataZoomComponent,
      PolarComponent,
      RadarComponent,
      CanvasRenderer,
    ]);
    registered = true;
  }
  return echarts;
}
