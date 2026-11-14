import { withAlpha } from "./color-alpha";
import { resolveChartSignature } from "./chart-signature";

/**
 * One gap rule for every grouped, stacked, composed and waterfall bar:
 * the signature `bar.categoryGap` between categories and `bar.groupGap`
 * between bars of one category. Histogram opts out (0 / 0 / 100%).
 */
export function barLayoutGaps(chartId: string): { barCategoryGap: string; barGap: string } {
  const { categoryGap, groupGap } = resolveChartSignature(chartId).bar;
  return { barCategoryGap: categoryGap, barGap: groupGap };
}

export function barSeriesColor(
  variant: string | undefined,
  strokeColor: string,
  fillColor = strokeColor,
) {
  switch (variant) {
    case "gradient":
      return {
        type: "linear" as const,
        x: 0,
        y: 1,
        x2: 0,
        y2: 0,
        colorStops: [
          { offset: 0, color: withAlpha(fillColor, 0.35) },
          { offset: 1, color: strokeColor },
        ],
      };
    case "duotone":
      return {
        type: "linear" as const,
        x: 0,
        y: 0,
        x2: 0,
        y2: 1,
        colorStops: [
          { offset: 0, color: strokeColor },
          { offset: 1, color: withAlpha(fillColor, 0.45) },
        ],
      };
    case "duotone-reverse":
      return {
        type: "linear" as const,
        x: 0,
        y: 0,
        x2: 0,
        y2: 1,
        colorStops: [
          { offset: 0, color: withAlpha(fillColor, 0.45) },
          { offset: 1, color: strokeColor },
        ],
      };
    default:
      return strokeColor;
  }
}
