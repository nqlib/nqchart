import type { Registry } from "shadcn/schema";
import { uiExamples } from "@/registry/registry-ui-examples";
import { docExamples } from "@/registry/registry-doc-examples";

export const examples: Registry["items"] = [
  {
    name: "ex-bar-chart",
    registryDependencies: ["@nqchart/bar-chart"],
    type: "registry:block",
    files: [{ path: "examples/ex-bar-chart.tsx", type: "registry:block" }],
  },
  {
    name: "ex-loading-state-bar-chart",
    registryDependencies: ["@nqchart/bar-chart"],
    type: "registry:block",
    files: [{ path: "examples/ex-loading-state-bar-chart.tsx", type: "registry:block" }],
  },
  {
    name: "ex-stacked-type-bar-chart",
    registryDependencies: ["@nqchart/bar-chart"],
    type: "registry:block",
    files: [{ path: "examples/ex-stacked-type-bar-chart.tsx", type: "registry:block" }],
  },
  {
    name: "ex-percent-type-bar-chart",
    registryDependencies: ["@nqchart/bar-chart"],
    type: "registry:block",
    files: [{ path: "examples/ex-percent-type-bar-chart.tsx", type: "registry:block" }],
  },
  {
    name: "ex-horizontal-layout-bar-chart",
    registryDependencies: ["@nqchart/bar-chart"],
    type: "registry:block",
    files: [{ path: "examples/ex-horizontal-layout-bar-chart.tsx", type: "registry:block" }],
  },
  {
    name: "ex-hatched-variant-bar-chart",
    registryDependencies: ["@nqchart/bar-chart"],
    type: "registry:block",
    files: [{ path: "examples/ex-hatched-variant-bar-chart.tsx", type: "registry:block" }],
  },
  {
    name: "ex-stripped-variant-bar-chart",
    registryDependencies: ["@nqchart/bar-chart"],
    type: "registry:block",
    files: [{ path: "examples/ex-stripped-variant-bar-chart.tsx", type: "registry:block" }],
  },
  {
    name: "ex-line-chart",
    registryDependencies: ["@nqchart/line-chart"],
    type: "registry:block",
    files: [{ path: "examples/ex-line-chart.tsx", type: "registry:block" }],
  },
  {
    name: "ex-loading-state-line-chart",
    registryDependencies: ["@nqchart/line-chart"],
    type: "registry:block",
    files: [{ path: "examples/ex-loading-state-line-chart.tsx", type: "registry:block" }],
  },
  {
    name: "ex-composed-chart",
    registryDependencies: ["@nqchart/composed-chart"],
    type: "registry:block",
    files: [{ path: "examples/ex-composed-chart.tsx", type: "registry:block" }],
  },
  {
    name: "ex-loading-state-composed-chart",
    registryDependencies: ["@nqchart/composed-chart"],
    type: "registry:block",
    files: [{ path: "examples/ex-loading-state-composed-chart.tsx", type: "registry:block" }],
  },
  {
    name: "ex-pareto-chart",
    registryDependencies: ["@nqchart/composed-chart", "@nqchart/chart-recipes"],
    type: "registry:block",
    files: [{ path: "examples/ex-pareto-chart.tsx", type: "registry:block" }],
  },
  {
    name: "ex-pie-chart",
    registryDependencies: ["@nqchart/pie-chart"],
    type: "registry:block",
    files: [{ path: "examples/ex-pie-chart.tsx", type: "registry:block" }],
  },
  {
    name: "ex-gauge-chart",
    registryDependencies: ["@nqchart/radial-chart"],
    type: "registry:block",
    files: [{ path: "examples/ex-gauge-chart.tsx", type: "registry:block" }],
  },
  {
    name: "ex-gauge-with-target-chart",
    registryDependencies: ["@nqchart/radial-chart"],
    type: "registry:block",
    files: [{ path: "examples/ex-gauge-with-target-chart.tsx", type: "registry:block" }],
  },
  {
    name: "ex-histogram-chart",
    registryDependencies: ["@nqchart/bar-chart", "@nqchart/chart-recipes"],
    type: "registry:block",
    files: [{ path: "examples/ex-histogram-chart.tsx", type: "registry:block" }],
  },
  {
    name: "ex-loading-state-histogram-chart",
    registryDependencies: ["@nqchart/bar-chart", "@nqchart/chart-recipes"],
    type: "registry:block",
    files: [{ path: "examples/ex-loading-state-histogram-chart.tsx", type: "registry:block" }],
  },
  {
    name: "ex-bullet-chart",
    registryDependencies: ["@nqchart/bar-chart", "@nqchart/chart-recipes"],
    type: "registry:block",
    files: [{ path: "examples/ex-bullet-chart.tsx", type: "registry:block" }],
  },
  {
    name: "ex-loading-state-pareto-chart",
    registryDependencies: ["@nqchart/composed-chart", "@nqchart/chart-recipes"],
    type: "registry:block",
    files: [{ path: "examples/ex-loading-state-pareto-chart.tsx", type: "registry:block" }],
  },
  {
    name: "ex-boxplot-chart",
    registryDependencies: ["@nqchart/composed-chart", "@nqchart/chart-recipes"],
    type: "registry:block",
    files: [{ path: "examples/ex-boxplot-chart.tsx", type: "registry:block" }],
  },
  {
    name: "ex-heatmap-chart",
    registryDependencies: ["@nqchart/heatmap-chart", "@nqchart/chart-recipes"],
    type: "registry:block",
    files: [{ path: "examples/ex-heatmap-chart.tsx", type: "registry:block" }],
  },
  {
    name: "ex-heatmap-weekly-chart",
    registryDependencies: ["@nqchart/heatmap-chart", "@nqchart/chart-recipes"],
    type: "registry:block",
    files: [{ path: "examples/ex-heatmap-weekly-chart.tsx", type: "registry:block" }],
  },
  {
    name: "ex-heatmap-correlation-chart",
    registryDependencies: ["@nqchart/heatmap-chart", "@nqchart/chart-recipes"],
    type: "registry:block",
    files: [{ path: "examples/ex-heatmap-correlation-chart.tsx", type: "registry:block" }],
  },
  {
    name: "ex-workload-dashboard-chart",
    registryDependencies: [
      "@nqchart/calendar-chart",
      "@nqchart/heatmap-chart",
      "@nqchart/chart-recipes",
    ],
    type: "registry:block",
    files: [{ path: "examples/ex-workload-dashboard-chart.tsx", type: "registry:block" }],
  },
  {
    name: "ex-calendar-workload-chart",
    registryDependencies: ["@nqchart/calendar-chart", "@nqchart/chart-recipes"],
    type: "registry:block",
    files: [{ path: "examples/ex-calendar-workload-chart.tsx", type: "registry:block" }],
  },
  {
    name: "ex-heatmap-team-workload-chart",
    registryDependencies: ["@nqchart/heatmap-chart", "@nqchart/chart-recipes"],
    type: "registry:block",
    files: [{ path: "examples/ex-heatmap-team-workload-chart.tsx", type: "registry:block" }],
  },
  ...uiExamples,
  ...docExamples,
];
