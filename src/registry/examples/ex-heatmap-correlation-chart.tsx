"use client";

import {
  BeeHeatmapChart,
  Heatmap,
  Tooltip,
  Legend,
} from "@/registry/charts/heatmap-chart";
import { prepareHeatmapCells } from "@/registry/lib/chart-recipes";
import { type ChartConfig } from "@/registry/ui/chart";

const products = ["Search", "Browse", "Cart", "Checkout", "Support", "Returns"];
const matrix = [
  [1.0, 0.72, 0.41, 0.28, 0.12, 0.08],
  [0.72, 1.0, 0.65, 0.34, 0.18, 0.11],
  [0.41, 0.65, 1.0, 0.78, 0.22, 0.15],
  [0.28, 0.34, 0.78, 1.0, 0.31, 0.19],
  [0.12, 0.18, 0.22, 0.31, 1.0, 0.54],
  [0.08, 0.11, 0.15, 0.19, 0.54, 1.0],
];

const { cells, min, max } = prepareHeatmapCells(products, products, matrix);

const chartConfig = {
  intensity: {
    label: "Correlation",
    colors: {
      light: ["#ecfdf5", "#059669", "#064e3b"],
      dark: ["#022c22", "#34d399", "#a7f3d0"],
    },
  },
} satisfies ChartConfig;

export function BeeExampleHeatmapCorrelationChart() {
  return (
    <BeeHeatmapChart config={chartConfig} className="h-full w-full p-4">
      <Heatmap
        dataKey="intensity"
        data={cells}
        xLabels={products}
        yLabels={products}
        min={min}
        max={max}
      />
      <Legend />
      <Tooltip />
    </BeeHeatmapChart>
  );
}
