import type { Registry } from "shadcn/schema";

const TARGET_BASE_PATH = "components/beecharts/ui";

export const ui: Registry["items"] = [
  {
    name: "chart",
    type: "registry:component",
    dependencies: ["echarts"],
    files: [
      {
        path: "ui/chart.tsx",
        type: "registry:component",
        target: TARGET_BASE_PATH + "/chart.tsx",
      },
    ],
  },
  {
    name: "tooltip",
    type: "registry:component",
    dependencies: ["echarts"],
    files: [
      {
        path: "ui/tooltip.tsx",
        type: "registry:component",
        target: TARGET_BASE_PATH + "/tooltip.tsx",
      },
    ],
  },
  {
    name: "legend",
    type: "registry:component",
    dependencies: ["echarts"],
    files: [
      {
        path: "ui/legend.tsx",
        type: "registry:component",
        target: TARGET_BASE_PATH + "/legend.tsx",
      },
    ],
  },
  {
    name: "dot",
    type: "registry:component",
    dependencies: ["echarts"],
    files: [
      {
        path: "ui/dot.tsx",
        type: "registry:component",
        target: TARGET_BASE_PATH + "/dot.tsx",
      },
    ],
  },
  {
    name: "bee-brush",
    type: "registry:component",
    registryDependencies: ["@beecharts/chart"],
    dependencies: ["echarts"],
    files: [
      {
        path: "ui/bee-brush.tsx",
        type: "registry:component",
        target: TARGET_BASE_PATH + "/bee-brush.tsx",
      },
    ],
  },
  {
    name: "background",
    type: "registry:component",
    dependencies: ["echarts"],
    files: [
      {
        path: "ui/background.tsx",
        type: "registry:component",
        target: TARGET_BASE_PATH + "/background.tsx",
      },
    ],
  },
];
