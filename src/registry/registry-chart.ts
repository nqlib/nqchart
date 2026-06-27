import type { Registry } from "shadcn/schema";

const TARGET_BASE_PATH = "components/beecharts/charts";

const CHART_DEPS = ["@beecharts/chart", "@beecharts/tooltip", "@beecharts/legend"];

export const charts: Registry["items"] = [
  {
    name: "bar-chart",
    description: "Bar chart (ECharts engine, compound API)",
    registryDependencies: CHART_DEPS,
    dependencies: ["echarts"],
    type: "registry:component",
    files: [
      {
        path: "charts/bar-chart.tsx",
        type: "registry:component",
        target: TARGET_BASE_PATH + "/bar-chart.tsx",
      },
    ],
  },
  {
    name: "line-chart",
    description: "Line chart (ECharts engine)",
    registryDependencies: CHART_DEPS,
    dependencies: ["echarts"],
    type: "registry:component",
    files: [
      {
        path: "charts/line-chart.tsx",
        type: "registry:component",
        target: TARGET_BASE_PATH + "/line-chart.tsx",
      },
    ],
  },
  {
    name: "composed-chart",
    description: "Composed bar + line chart (ECharts engine)",
    registryDependencies: CHART_DEPS,
    dependencies: ["echarts"],
    type: "registry:component",
    files: [
      {
        path: "charts/composed-chart.tsx",
        type: "registry:component",
        target: TARGET_BASE_PATH + "/composed-chart.tsx",
      },
    ],
  },
  {
    name: "pie-chart",
    description: "Pie / donut chart (ECharts engine)",
    registryDependencies: CHART_DEPS,
    dependencies: ["echarts"],
    type: "registry:component",
    files: [
      {
        path: "charts/pie-chart.tsx",
        type: "registry:component",
        target: TARGET_BASE_PATH + "/pie-chart.tsx",
      },
    ],
  },
  {
    name: "heatmap-chart",
    description: "Heatmap chart (ECharts engine)",
    registryDependencies: CHART_DEPS,
    dependencies: ["echarts"],
    type: "registry:component",
    files: [
      {
        path: "charts/heatmap-chart.tsx",
        type: "registry:component",
        target: TARGET_BASE_PATH + "/heatmap-chart.tsx",
      },
    ],
  },
  {
    name: "calendar-chart",
    description: "Calendar heatmap chart (ECharts engine)",
    registryDependencies: CHART_DEPS,
    dependencies: ["echarts"],
    type: "registry:component",
    files: [
      {
        path: "charts/calendar-chart.tsx",
        type: "registry:component",
        target: TARGET_BASE_PATH + "/calendar-chart.tsx",
      },
    ],
  },
  {
    name: "radial-chart",
    description: "Radial / gauge chart (ECharts engine)",
    registryDependencies: CHART_DEPS,
    dependencies: ["echarts"],
    type: "registry:component",
    files: [
      {
        path: "charts/radial-chart.tsx",
        type: "registry:component",
        target: TARGET_BASE_PATH + "/radial-chart.tsx",
      },
    ],
  },
  {
    name: "area-chart",
    description: "Area chart (ECharts engine)",
    registryDependencies: CHART_DEPS,
    dependencies: ["echarts"],
    type: "registry:component",
    files: [
      {
        path: "charts/area-chart.tsx",
        type: "registry:component",
        target: TARGET_BASE_PATH + "/area-chart.tsx",
      },
    ],
  },
  {
    name: "scatter-chart",
    description: "Scatter / bubble chart (ECharts engine)",
    registryDependencies: CHART_DEPS,
    dependencies: ["echarts"],
    type: "registry:component",
    files: [
      {
        path: "charts/scatter-chart.tsx",
        type: "registry:component",
        target: TARGET_BASE_PATH + "/scatter-chart.tsx",
      },
    ],
  },
  {
    name: "radar-chart",
    description: "Radar chart (ECharts engine)",
    registryDependencies: CHART_DEPS,
    dependencies: ["echarts"],
    type: "registry:component",
    files: [
      {
        path: "charts/radar-chart.tsx",
        type: "registry:component",
        target: TARGET_BASE_PATH + "/radar-chart.tsx",
      },
    ],
  },
  {
    name: "sankey-chart",
    description: "Sankey flow chart (ECharts engine)",
    registryDependencies: CHART_DEPS,
    dependencies: ["echarts"],
    type: "registry:component",
    files: [
      {
        path: "charts/sankey-chart.tsx",
        type: "registry:component",
        target: TARGET_BASE_PATH + "/sankey-chart.tsx",
      },
    ],
  },
  {
    name: "funnel-chart",
    description: "Funnel chart (ECharts engine)",
    registryDependencies: CHART_DEPS,
    dependencies: ["echarts"],
    type: "registry:component",
    files: [
      {
        path: "charts/funnel-chart.tsx",
        type: "registry:component",
        target: TARGET_BASE_PATH + "/funnel-chart.tsx",
      },
    ],
  },
  {
    name: "waterfall-chart",
    description: "Waterfall chart (ECharts engine)",
    registryDependencies: CHART_DEPS,
    dependencies: ["echarts"],
    type: "registry:component",
    files: [
      {
        path: "charts/waterfall-chart.tsx",
        type: "registry:component",
        target: TARGET_BASE_PATH + "/waterfall-chart.tsx",
      },
    ],
  },
  {
    name: "treemap-chart",
    description: "Treemap chart (ECharts engine)",
    registryDependencies: CHART_DEPS,
    dependencies: ["echarts"],
    type: "registry:component",
    files: [
      {
        path: "charts/treemap-chart.tsx",
        type: "registry:component",
        target: TARGET_BASE_PATH + "/treemap-chart.tsx",
      },
    ],
  },
  {
    name: "sparkline-chart",
    description: "Sparkline chart (ECharts engine)",
    registryDependencies: CHART_DEPS,
    dependencies: ["echarts"],
    type: "registry:component",
    files: [
      {
        path: "charts/sparkline-chart.tsx",
        type: "registry:component",
        target: TARGET_BASE_PATH + "/sparkline-chart.tsx",
      },
    ],
  },
];
