import type { EChartsType } from "echarts/core";
import { resolveChartChrome } from "./resolve-chart-chrome";

export type ChartExportOpts = {
  /**
   * Raster format. Charts initialise with `CanvasRenderer` only, so SVG is not
   * produced — ECharts would call `canvas.toDataURL("image/svg")`, which
   * browsers treat as an unknown type and silently return PNG.
   */
  type?: "png";
  pixelRatio?: number;
  backgroundColor?: string;
};

export type ChartHandle = {
  /** Underlying ECharts instance — unsupported surface; prefer typed props. */
  getInstance: () => EChartsType | null;
  toDataURL: (opts?: ChartExportOpts) => string;
};

export function createChartHandle(
  getInstance: () => EChartsType | null,
  chartId?: string,
): ChartHandle {
  return {
    getInstance,
    toDataURL(opts) {
      const instance = getInstance();
      if (!instance) return "";
      const backgroundColor =
        opts?.backgroundColor ??
        (chartId ? resolveChartChrome(chartId).background : "#ffffff");
      return instance.getDataURL({
        type: "png",
        pixelRatio: opts?.pixelRatio ?? 2,
        backgroundColor,
      });
    },
  };
}
