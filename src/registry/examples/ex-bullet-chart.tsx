"use client";

import { BeeBarChart, Bar, Grid, XAxis, YAxis, Tooltip, Legend } from "@/registry/charts/bar-chart";
import { prepareBulletRow } from "@/registry/lib/chart-recipes";
import { type ChartConfig } from "@/registry/ui/chart";

const data = [prepareBulletRow("Revenue", { actual: 72, target: 80, max: 100 })];

const chartConfig = {
  poor: {
    label: "Poor",
    colors: { light: ["#e7e5e4"], dark: ["#3f3f46"] },
  },
  satisfactory: {
    label: "Satisfactory",
    colors: { light: ["#d6d3d1"], dark: ["#52525b"] },
  },
  good: {
    label: "Good",
    colors: { light: ["#a8a29e"], dark: ["#71717a"] },
  },
  actual: {
    label: "Actual",
    colors: { light: ["#ea580c"], dark: ["#fb923c"] },
  },
  target: {
    label: "Target",
    colors: { light: ["#ca8a04"], dark: ["#facc15"] },
  },
} satisfies ChartConfig;

export function BeeExampleBulletChart() {
  return (
    <BeeBarChart
      config={chartConfig}
      data={data}
      xDataKey="label"
      layout="horizontal"
      className="h-full w-full p-4"
      barRadius={4}
    >
      <Grid />
      <XAxis />
      <YAxis />
      <Legend />
      <Tooltip />
      <Bar dataKey="poor" stackId="range" />
      <Bar dataKey="satisfactory" stackId="range" />
      <Bar dataKey="good" stackId="range" />
      <Bar dataKey="actual" radius={4} />
      <Bar dataKey="target" radius={2} />
    </BeeBarChart>
  );
}
