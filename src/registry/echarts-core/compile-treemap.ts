import type { EChartsOption } from "echarts";
import { applyChartUiToOption } from "./apply-chart-ui";
import { resolveChartCornerRadius } from "./chart-corner-radius";
import { treemapFocus, hoverFocusOrOff, isHoverFocusOn } from "./emphasis-presets";
import {
  resolveCanvasGapColor,
  resolveCanvasGroupLabelColor,
  resolveCanvasTileLabelColor,
} from "./resolve-chart-chrome";
import type { CompileContext, TreemapNode, TreemapPart, TreemapStylePart } from "./parts/types";
import { CHART_TYPOGRAPHY } from "./chart-typography-tokens";

const TILE_BORDER = 2;
const TILE_GAP = 3;

/** Leaf colors + labels only — borders/gaps live on series `levels` (ECharts treemap pattern). */
function colorizeTree(
  nodes: TreemapNode[],
  resolveColor: (key: string) => string,
  tileLabelColor: string,
  groupLabelColor: string,
): TreemapNode[] {
  return nodes.map((node) => {
    const isParent = Boolean(node.children?.length);

    return {
      ...node,
      itemStyle: {
        color: resolveColor(node.name),
      },
      label: {
        color: isParent ? groupLabelColor : tileLabelColor,
      },
      children: node.children
        ? colorizeTree(node.children, resolveColor, tileLabelColor, groupLabelColor)
        : undefined,
    };
  });
}

export function compileTreemapOption(ctx: CompileContext): EChartsOption {
  const treemap = ctx.parts.find((p): p is TreemapPart => p.type === "treemap");
  const style = ctx.parts.find((p): p is TreemapStylePart => p.type === "treemapStyle");
  const showLabels = style?.showLabels ?? true;
  const gapColor = resolveCanvasGapColor(ctx.chartId);
  const tileLabelColor = resolveCanvasTileLabelColor(ctx.chartId);
  const groupLabelColor = resolveCanvasGroupLabelColor(ctx.chartId);

  const tree =
    treemap?.tree ??
    ctx.data.map((row) => ({
      name: String(row.name ?? row[treemap?.dataKey ?? "name"] ?? ""),
      value: Number(row.value ?? row[treemap?.dataKey ?? "value"] ?? 0),
    }));

  const colored = colorizeTree(
    tree,
    (key) => ctx.resolveColor(key, 0),
    tileLabelColor,
    groupLabelColor,
  );

  const tileBorderStyle = {
    borderColor: gapColor,
    borderWidth: TILE_BORDER,
    gapWidth: TILE_GAP,
    borderRadius: resolveChartCornerRadius(ctx.chartId),
  };

  const base: EChartsOption = {
    tooltip: { trigger: "item" },
    series: [
      {
        type: "treemap",
        roam: false,
        sort: false,
        nodeClick: style?.isClickable ? "zoomToNode" : false,
        breadcrumb: { show: false },
        width: "100%",
        height: "100%",
        squareRatio: 0.5 * (1 + Math.sqrt(5)),
        itemStyle: tileBorderStyle,
        label: {
          show: showLabels,
          ...CHART_TYPOGRAPHY.markLabelDense,
          color: tileLabelColor,
          overflow: "truncate",
          ellipsis: "...",
        },
        upperLabel: {
          show: true,
          height: 26,
          ...CHART_TYPOGRAPHY.markEmphasis,
          color: groupLabelColor,
        },
        levels: [
          {
            itemStyle: {
              borderWidth: 0,
              gapWidth: TILE_GAP + 1,
            },
            upperLabel: { show: false },
          },
          {
            itemStyle: tileBorderStyle,
            label: { show: showLabels, color: tileLabelColor },
            upperLabel: { color: groupLabelColor },
          },
        ],
        ...hoverFocusOrOff(isHoverFocusOn(ctx), treemapFocus()),
        data: colored,
      },
    ],
  };

  return applyChartUiToOption(ctx, base);
}
