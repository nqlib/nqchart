"use client";

import {
  BeeHeatmapChart,
  Heatmap,
  Tooltip,
  Legend,
} from "@/registry/charts/heatmap-chart";
import { prepareTeamWorkloadMatrix } from "@/registry/lib/chart-recipes";
import {
  WORKLOAD_TEAM_ROWS,
  WORKLOAD_UTILIZATION_CONFIG,
  WORKLOAD_WEEK_DATES,
} from "@/registry/examples/workload-demo-data";

const { cells, min, max, rowLabels, colLabels } = prepareTeamWorkloadMatrix(
  [...WORKLOAD_WEEK_DATES],
  WORKLOAD_TEAM_ROWS,
);

export function BeeExampleHeatmapTeamWorkloadChart() {
  return (
    <BeeHeatmapChart config={WORKLOAD_UTILIZATION_CONFIG} className="h-full w-full p-4">
      <Heatmap
        dataKey="utilization"
        data={cells}
        xLabels={colLabels}
        yLabels={rowLabels}
        min={min}
        max={max}
        enableZoom={false}
      />
      <Legend />
      <Tooltip />
    </BeeHeatmapChart>
  );
}
