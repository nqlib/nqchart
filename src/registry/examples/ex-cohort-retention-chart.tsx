"use client";

import {
  NQHeatmapChart,
  Heatmap,
  Tooltip,
  Legend,
} from "@/registry/charts/heatmap-chart";
import { prepareCohortCells } from "@/registry/lib/chart-recipes";
import { type ChartConfig } from "@/registry/ui/chart";

// Active users per signup cohort and months since signup (period 0 = cohort size).
const cohorts: Record<string, number[]> = {
  "2026-01": [1000, 620, 480, 410, 372, 350],
  "2026-02": [940, 575, 440, 380, 345],
  "2026-03": [1100, 700, 540, 455],
  "2026-04": [1050, 690, 520],
  "2026-05": [1180, 760],
  "2026-06": [1240],
};

const rows = Object.entries(cohorts).flatMap(([cohort, values]) =>
  values.map((value, period) => ({ cohort, period, users: value })),
);

const { cells, xLabels, yLabels, min, max } = prepareCohortCells(rows, {
  cohortKey: "cohort",
  periodKey: "period",
  valueKey: "users",
  mode: "percent",
});

const chartConfig = {
  retention: {
    label: "Retention (%)",
    colors: {
      light: ["#ecfdf5", "#34d399", "#065f46"],
      dark: ["#022c22", "#059669", "#6ee7b7"],
    },
  },
} satisfies ChartConfig;

export function NQExampleCohortRetentionChart() {
  return (
    <NQHeatmapChart config={chartConfig} className="h-full w-full p-4">
      <Heatmap
        dataKey="retention"
        data={cells}
        xLabels={xLabels}
        // Oldest cohort on top: a category y-axis draws its first label at the bottom.
        yLabels={[...yLabels].reverse()}
        min={min}
        max={max}
        enableZoom={false}
      />
      <Legend />
      <Tooltip />
    </NQHeatmapChart>
  );
}
