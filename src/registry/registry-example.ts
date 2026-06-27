import type { Registry } from "shadcn/schema";
import { uiExamples } from "@/registry/registry-ui-examples";
import { docExamples } from "@/registry/registry-doc-examples";

export const examples: Registry["items"] = [
  {
    name: "ex-bar-chart",
    registryDependencies: ["@beecharts/bar-chart"],
    type: "registry:block",
    files: [{ path: "examples/ex-bar-chart.tsx", type: "registry:block" }],
  },
  {
    name: "ex-loading-state-bar-chart",
    registryDependencies: ["@beecharts/bar-chart"],
    type: "registry:block",
    files: [{ path: "examples/ex-loading-state-bar-chart.tsx", type: "registry:block" }],
  },
  {
    name: "ex-stacked-type-bar-chart",
    registryDependencies: ["@beecharts/bar-chart"],
    type: "registry:block",
    files: [{ path: "examples/ex-stacked-type-bar-chart.tsx", type: "registry:block" }],
  },
  {
    name: "ex-percent-type-bar-chart",
    registryDependencies: ["@beecharts/bar-chart"],
    type: "registry:block",
    files: [{ path: "examples/ex-percent-type-bar-chart.tsx", type: "registry:block" }],
  },
  {
    name: "ex-horizontal-layout-bar-chart",
    registryDependencies: ["@beecharts/bar-chart"],
    type: "registry:block",
    files: [{ path: "examples/ex-horizontal-layout-bar-chart.tsx", type: "registry:block" }],
  },
  {
    name: "ex-hatched-variant-bar-chart",
    registryDependencies: ["@beecharts/bar-chart"],
    type: "registry:block",
    files: [{ path: "examples/ex-hatched-variant-bar-chart.tsx", type: "registry:block" }],
  },
  {
    name: "ex-stripped-variant-bar-chart",
    registryDependencies: ["@beecharts/bar-chart"],
    type: "registry:block",
    files: [{ path: "examples/ex-stripped-variant-bar-chart.tsx", type: "registry:block" }],
  },
  {
    name: "ex-line-chart",
    registryDependencies: ["@beecharts/line-chart"],
    type: "registry:block",
    files: [{ path: "examples/ex-line-chart.tsx", type: "registry:block" }],
  },
  {
    name: "ex-loading-state-line-chart",
    registryDependencies: ["@beecharts/line-chart"],
    type: "registry:block",
    files: [{ path: "examples/ex-loading-state-line-chart.tsx", type: "registry:block" }],
  },
  {
    name: "ex-composed-chart",
    registryDependencies: ["@beecharts/composed-chart"],
    type: "registry:block",
    files: [{ path: "examples/ex-composed-chart.tsx", type: "registry:block" }],
  },
  {
    name: "ex-loading-state-composed-chart",
    registryDependencies: ["@beecharts/composed-chart"],
    type: "registry:block",
    files: [{ path: "examples/ex-loading-state-composed-chart.tsx", type: "registry:block" }],
  },
  {
    name: "ex-pareto-chart",
    registryDependencies: ["@beecharts/composed-chart", "@beecharts/chart-recipes"],
    type: "registry:block",
    files: [{ path: "examples/ex-pareto-chart.tsx", type: "registry:block" }],
  },
  {
    name: "ex-pie-chart",
    registryDependencies: ["@beecharts/pie-chart"],
    type: "registry:block",
    files: [{ path: "examples/ex-pie-chart.tsx", type: "registry:block" }],
  },
  {
    name: "ex-gauge-chart",
    registryDependencies: ["@beecharts/radial-chart"],
    type: "registry:block",
    files: [{ path: "examples/ex-gauge-chart.tsx", type: "registry:block" }],
  },
  {
    name: "ex-gauge-with-target-chart",
    registryDependencies: ["@beecharts/radial-chart"],
    type: "registry:block",
    files: [{ path: "examples/ex-gauge-with-target-chart.tsx", type: "registry:block" }],
  },
  {
    name: "ex-histogram-chart",
    registryDependencies: ["@beecharts/bar-chart", "@beecharts/chart-recipes"],
    type: "registry:block",
    files: [{ path: "examples/ex-histogram-chart.tsx", type: "registry:block" }],
  },
  {
    name: "ex-loading-state-histogram-chart",
    registryDependencies: ["@beecharts/bar-chart", "@beecharts/chart-recipes"],
    type: "registry:block",
    files: [{ path: "examples/ex-loading-state-histogram-chart.tsx", type: "registry:block" }],
  },
  {
    name: "ex-bullet-chart",
    registryDependencies: ["@beecharts/bar-chart", "@beecharts/chart-recipes"],
    type: "registry:block",
    files: [{ path: "examples/ex-bullet-chart.tsx", type: "registry:block" }],
  },
  {
    name: "ex-loading-state-pareto-chart",
    registryDependencies: ["@beecharts/composed-chart", "@beecharts/chart-recipes"],
    type: "registry:block",
    files: [{ path: "examples/ex-loading-state-pareto-chart.tsx", type: "registry:block" }],
  },
  {
    name: "ex-boxplot-chart",
    registryDependencies: ["@beecharts/composed-chart", "@beecharts/chart-recipes"],
    type: "registry:block",
    files: [{ path: "examples/ex-boxplot-chart.tsx", type: "registry:block" }],
  },
  {
    name: "ex-heatmap-chart",
    registryDependencies: ["@beecharts/heatmap-chart", "@beecharts/chart-recipes"],
    type: "registry:block",
    files: [{ path: "examples/ex-heatmap-chart.tsx", type: "registry:block" }],
  },
  {
    name: "ex-heatmap-weekly-chart",
    registryDependencies: ["@beecharts/heatmap-chart", "@beecharts/chart-recipes"],
    type: "registry:block",
    files: [{ path: "examples/ex-heatmap-weekly-chart.tsx", type: "registry:block" }],
  },
  {
    name: "ex-heatmap-correlation-chart",
    registryDependencies: ["@beecharts/heatmap-chart", "@beecharts/chart-recipes"],
    type: "registry:block",
    files: [{ path: "examples/ex-heatmap-correlation-chart.tsx", type: "registry:block" }],
  },
  {
    name: "ex-workload-dashboard-chart",
    registryDependencies: [
      "@beecharts/calendar-chart",
      "@beecharts/heatmap-chart",
      "@beecharts/chart-recipes",
    ],
    type: "registry:block",
    files: [{ path: "examples/ex-workload-dashboard-chart.tsx", type: "registry:block" }],
  },
  {
    name: "ex-calendar-workload-chart",
    registryDependencies: ["@beecharts/calendar-chart", "@beecharts/chart-recipes"],
    type: "registry:block",
    files: [{ path: "examples/ex-calendar-workload-chart.tsx", type: "registry:block" }],
  },
  {
    name: "ex-heatmap-team-workload-chart",
    registryDependencies: ["@beecharts/heatmap-chart", "@beecharts/chart-recipes"],
    type: "registry:block",
    files: [{ path: "examples/ex-heatmap-team-workload-chart.tsx", type: "registry:block" }],
  },
  ...uiExamples,
  ...docExamples,
];
