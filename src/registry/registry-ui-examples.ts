import type { Registry } from "shadcn/schema";

const UI_EXAMPLE_FILE = "examples/ex-ui-charts.tsx";

function uiExample(
  name: string,
  exportName: string,
  deps: string[] = ["@nqchart/line-chart"],
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
  uiExample("ex-bg-dots-line-chart", "NQExampleBgDotsLineChart"),
  uiExample("ex-bg-graph-paper-line-chart", "NQExampleBgGraphPaperLineChart"),
  uiExample("ex-bg-cross-hatch-line-chart", "NQExampleBgCrossHatchLineChart"),
  uiExample("ex-bg-diagonal-lines-line-chart", "NQExampleBgDiagonalLinesLineChart"),
  uiExample("ex-bg-plus-line-chart", "NQExampleBgPlusLineChart"),
  uiExample("ex-bg-falling-triangles-line-chart", "NQExampleBgFallingTrianglesLineChart"),
  uiExample("ex-bg-4-pointed-star-line-chart", "NQExampleBg4PointedStarLineChart"),
  uiExample("ex-bg-tiny-checkers-line-chart", "NQExampleBgTinyCheckersLineChart"),
  uiExample("ex-bg-overlapping-circles-line-chart", "NQExampleBgOverlappingCirclesLineChart"),
  uiExample("ex-bg-wiggle-lines-line-chart", "NQExampleBgWiggleLinesLineChart"),
  uiExample("ex-bg-bubbles-line-chart", "NQExampleBgBubblesLineChart"),
  uiExample("ex-legend-square-line-chart", "NQExampleLegendSquareLineChart"),
  uiExample("ex-legend-circle-line-chart", "NQExampleLegendCircleLineChart"),
  uiExample("ex-legend-circle-outline-line-chart", "NQExampleLegendCircleOutlineLineChart"),
  uiExample("ex-legend-rounded-square-line-chart", "NQExampleLegendRoundedSquareLineChart"),
  uiExample(
    "ex-legend-rounded-square-outline-line-chart",
    "NQExampleLegendRoundedSquareOutlineLineChart",
  ),
  uiExample("ex-legend-vertical-bar-line-chart", "NQExampleLegendVerticalBarLineChart"),
  uiExample("ex-legend-horizontal-bar-line-chart", "NQExampleLegendHorizontalBarLineChart"),
  uiExample(
    "ex-tooltip-default-bar-chart",
    "NQExampleTooltipDefaultBarChart",
    ["@nqchart/bar-chart"],
  ),
  uiExample(
    "ex-tooltip-frosted-glass-bar-chart",
    "NQExampleTooltipFrostedGlassBarChart",
    ["@nqchart/bar-chart"],
  ),
];
