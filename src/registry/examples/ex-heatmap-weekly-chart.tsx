"use client";

import {
  BeeHeatmapChart,
  Heatmap,
  Tooltip,
  Legend,
} from "@/registry/charts/heatmap-chart";
import { prepareHeatmapCells } from "@/registry/lib/chart-recipes";
import { type ChartConfig } from "@/registry/ui/chart";

const rowLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const colLabels = ["6a", "9a", "12p", "3p", "6p", "9p", "12a", "3a"];
const matrix = [
  [4, 18, 32, 28, 22, 14, 8, 3],
  [6, 22, 38, 34, 26, 16, 10, 4],
  [5, 20, 36, 30, 24, 15, 9, 3],
  [7, 24, 42, 38, 30, 18, 11, 5],
  [8, 26, 44, 40, 32, 20, 12, 6],
  [12, 28, 36, 32, 28, 24, 18, 10],
  [10, 22, 30, 26, 22, 20, 16, 8],
];

const { cells, min, max } = prepareHeatmapCells(rowLabels, colLabels, matrix);

const chartConfig = {
  intensity: {
    label: "Active users",
    colors: {
      light: ["#fff1f2", "#e11d48", "#881337"],
      dark: ["#4c0519", "#fb7185", "#fecdd3"],
    },
  },
} satisfies ChartConfig;

export function BeeExampleHeatmapWeeklyChart() {
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
