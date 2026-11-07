import { CHART_TYPOGRAPHY } from "./chart-typography-tokens";
import { resolveCanvasChartChrome } from "./resolve-chart-chrome";
/** Point labels on bar / line / area series. */

export function seriesLabelOption(
  showLabels?: boolean,
  labelFormatter?: (value: unknown) => string,
  chartId?: string,
): Record<string, unknown> | undefined {
  if (!showLabels) return undefined;
  return {
    show: true,
    position: "top",
    // An explicit color + transparent border switch off ECharts' automatic
    // white "outside stroke", which smudges value labels on dark canvases.
    color: chartId ? resolveCanvasChartChrome(chartId).foreground : undefined,
    textBorderColor: "transparent",
    textBorderWidth: 0,
    ...CHART_TYPOGRAPHY.markLabel,
    formatter: labelFormatter
      ? (params: { value?: unknown }) => {
          const v = Array.isArray(params.value)
            ? params.value[params.value.length - 1]
            : params.value;
          // A missing point (null / "-") gets no label — otherwise a formatter
          // like `Number(v)` prints "0" on top of a stacked neighbour's label.
          if (v == null || v === "-") return "";
          return labelFormatter(v);
        }
      : undefined,
  };
}

/** Outer end of a bar: above / right for positive values, below / left for negative. */
export function barLabelPosition(value: number | null, horizontal: boolean): string {
  const negative = typeof value === "number" && value < 0;
  if (horizontal) return negative ? "left" : "right";
  return negative ? "bottom" : "top";
}
