import type { Registry } from "shadcn/schema";

const TARGET_BASE_PATH = "components/beecharts/blocks";

export const blocks: Registry["items"] = [
  {
    name: "monospace-bar-chart",
    description: "Terminal-style bar chart with monospace KPI chrome (ECharts)",
    dependencies: ["echarts", "motion"],
    registryDependencies: ["@beecharts/bar-chart"],
    type: "registry:block",
    files: [
      {
        path: "blocks/b-monospace-bar-chart.tsx",
        type: "registry:block",
        target: `${TARGET_BASE_PATH}/monospace-bar-chart.tsx`,
      },
    ],
  },
  {
    name: "hover-trace-bar-chart",
    description: "Bar chart with KPI header trace (ECharts)",
    dependencies: ["echarts"],
    registryDependencies: ["@beecharts/bar-chart"],
    type: "registry:block",
    files: [
      {
        path: "blocks/b-hover-trace-bar-chart.tsx",
        type: "registry:block",
        target: `${TARGET_BASE_PATH}/hover-trace-bar-chart.tsx`,
      },
    ],
  },
  {
    name: "grid-bar-chart",
    description: "Stacked ghost grid bar chart (ECharts)",
    dependencies: ["echarts"],
    registryDependencies: ["@beecharts/bar-chart"],
    type: "registry:block",
    files: [
      {
        path: "blocks/b-grid-bar-chart.tsx",
        type: "registry:block",
        target: `${TARGET_BASE_PATH}/grid-bar-chart.tsx`,
      },
    ],
  },
  {
    name: "isometric-bar-chart",
    description: "Rounded bar chart block (ECharts)",
    dependencies: ["echarts"],
    registryDependencies: ["@beecharts/bar-chart"],
    type: "registry:block",
    files: [
      {
        path: "blocks/b-isometric-bar-chart.tsx",
        type: "registry:block",
        target: `${TARGET_BASE_PATH}/isometric-bar-chart.tsx`,
      },
    ],
  },
];
