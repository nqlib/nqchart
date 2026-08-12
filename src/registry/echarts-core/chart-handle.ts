import type { EChartsType } from "echarts/core";
import { resolveChartChrome } from "./resolve-chart-chrome";

export type ChartExportOpts = {
  type?: "png" | "svg";
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
      const type = opts?.type === "svg" ? "svg" : "png";
      const backgroundColor =
        opts?.backgroundColor ??
        (chartId ? resolveChartChrome(chartId).background : "#ffffff");
      return instance.getDataURL({
        type,
        pixelRatio: opts?.pixelRatio ?? 2,
        backgroundColor,
      });
    },
  };
}
