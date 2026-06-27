"use client";

import {
  BeeComposedChart,
  Bar,
  Line,
  Grid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "@/registry/charts/composed-chart";
import { prepareBoxPlotRow } from "@/registry/lib/chart-recipes";
import { type ChartConfig } from "@/registry/ui/chart";

const raw = [
  prepareBoxPlotRow("Team A", [12, 14, 15, 18, 19, 21, 22, 24, 28, 32, 45]),
  prepareBoxPlotRow("Team B", [8, 10, 11, 13, 14, 16, 17, 18, 20, 22, 38]),
  prepareBoxPlotRow("Team C", [20, 22, 24, 26, 28, 30, 32, 34, 36, 40, 52]),
];

const data = raw.map((row) => ({
  category: row.category,
  iqrFloor: row.q1,
  iqr: Math.max(row.q3 - row.q1, 1),
  median: row.median,
  min: row.min,
  max: row.max,
}));

const yMax = Math.max(...raw.map((row) => row.max)) + 4;

const chartConfig = {
  iqrFloor: {
    label: "Q1 floor",
    colors: { light: ["#e7e5e4"], dark: ["#27272a"] },
  },
  iqr: {
    label: "IQR (Q1–Q3)",
    colors: { light: ["#2563eb"], dark: ["#60a5fa"] },
  },
  median: {
    label: "Median",
    colors: { light: ["#0f172a"], dark: ["#f8fafc"] },
  },
} satisfies ChartConfig;

export function BeeExampleBoxplotChart() {
  return (
    <BeeComposedChart
      config={chartConfig}
      data={data}
      xDataKey="category"
      className="h-full w-full p-4"
      showBrush={false}
    >
      <Grid />
      <XAxis dataKey="category" />
      <YAxis domain={[0, yMax]} />
      <Legend />
      <Tooltip />
      <Bar dataKey="iqrFloor" stackId="box" radius={0} showInLegend={false} />
      <Bar dataKey="iqr" stackId="box" radius={4} />
      <Line dataKey="median" variant="points" />
    </BeeComposedChart>
  );
}
