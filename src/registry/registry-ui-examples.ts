import type { Registry } from "shadcn/schema";

const UI_EXAMPLE_FILE = "examples/ex-ui-charts.tsx";

function uiExample(
  name: string,
  exportName: string,
  deps: string[] = ["@beecharts/line-chart"],
): Registry["items"][number] {
  return {
    name,
    registryDependencies: deps,
    type: "registry:block",
    files: [{ path: UI_EXAMPLE_FILE, type: "registry:block" }],
    meta: { exportName },
  };
}

export const uiExamples: Registry["items"] = [
  uiExample("ex-bg-dots-line-chart", "BeeExampleBgDotsLineChart"),
  uiExample("ex-bg-graph-paper-line-chart", "BeeExampleBgGraphPaperLineChart"),
  uiExample("ex-bg-cross-hatch-line-chart", "BeeExampleBgCrossHatchLineChart"),
  uiExample("ex-bg-diagonal-lines-line-chart", "BeeExampleBgDiagonalLinesLineChart"),
  uiExample("ex-bg-plus-line-chart", "BeeExampleBgPlusLineChart"),
  uiExample("ex-bg-falling-triangles-line-chart", "BeeExampleBgFallingTrianglesLineChart"),
  uiExample("ex-bg-4-pointed-star-line-chart", "BeeExampleBg4PointedStarLineChart"),
  uiExample("ex-bg-tiny-checkers-line-chart", "BeeExampleBgTinyCheckersLineChart"),
  uiExample("ex-bg-overlapping-circles-line-chart", "BeeExampleBgOverlappingCirclesLineChart"),
  uiExample("ex-bg-wiggle-lines-line-chart", "BeeExampleBgWiggleLinesLineChart"),
  uiExample("ex-bg-bubbles-line-chart", "BeeExampleBgBubblesLineChart"),
  uiExample("ex-legend-square-line-chart", "BeeExampleLegendSquareLineChart"),
  uiExample("ex-legend-circle-line-chart", "BeeExampleLegendCircleLineChart"),
  uiExample("ex-legend-circle-outline-line-chart", "BeeExampleLegendCircleOutlineLineChart"),
  uiExample("ex-legend-rounded-square-line-chart", "BeeExampleLegendRoundedSquareLineChart"),
  uiExample(
    "ex-legend-rounded-square-outline-line-chart",
    "BeeExampleLegendRoundedSquareOutlineLineChart",
  ),
  uiExample("ex-legend-vertical-bar-line-chart", "BeeExampleLegendVerticalBarLineChart"),
  uiExample("ex-legend-horizontal-bar-line-chart", "BeeExampleLegendHorizontalBarLineChart"),
  uiExample(
    "ex-tooltip-default-bar-chart",
    "BeeExampleTooltipDefaultBarChart",
    ["@beecharts/bar-chart"],
  ),
  uiExample(
    "ex-tooltip-frosted-glass-bar-chart",
    "BeeExampleTooltipFrostedGlassBarChart",
    ["@beecharts/bar-chart"],
  ),
];
