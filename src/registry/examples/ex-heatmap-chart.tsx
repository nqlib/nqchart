"use client";

import {
  BeeHeatmapChart,
  Heatmap,
  Tooltip,
  Legend,
} from "@/registry/charts/heatmap-chart";
import { prepareHeatmapCells } from "@/registry/lib/chart-recipes";
import { type ChartConfig } from "@/registry/ui/chart";

const rowLabels = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const colLabels = ["9am", "12pm", "3pm", "6pm"];
const matrix = [
  [12, 28, 45, 22],
  [18, 35, 52, 30],
  [10, 22, 38, 18],
  [24, 42, 58, 36],
  [15, 30, 48, 26],
];

const { cells, min, max } = prepareHeatmapCells(rowLabels, colLabels, matrix);

const chartConfig = {
  intensity: {
    label: "Sessions",
    colors: {
      light: ["#fff7ed", "#f97316", "#9a3412"],
      dark: ["#431407", "#ea580c", "#fdba74"],
    },
  },
} satisfies ChartConfig;

export function BeeExampleHeatmapChart() {
  return (
    <BeeHeatmapChart config={chartConfig} className="h-full w-full p-4">
      <Heatmap
        dataKey="intensity"
        data={cells}
        xLabels={colLabels}
        yLabels={rowLabels}
        min={min}
        max={max}
      />
      <Legend />
      <Tooltip />
    </BeeHeatmapChart>
  );
}
