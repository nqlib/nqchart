"use client";

import { BeeBarChart, Bar, Grid, XAxis, YAxis, Tooltip, Legend } from "@/registry/charts/bar-chart";
import { binForHistogram } from "@/registry/lib/chart-recipes";
import { type ChartConfig } from "@/registry/ui/chart";

const values = [
  12, 14, 15, 18, 19, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 38, 40,
  42, 45, 48, 52, 55, 58, 62, 65, 68, 72, 75, 78, 82, 85, 88, 92, 95,
];

const data = binForHistogram(values, 8);

const chartConfig = {
  count: {
    label: "Frequency",
    colors: {
      light: ["#059669"],
      dark: ["#34d399"],
    },
  },
} satisfies ChartConfig;

export function BeeExampleHistogramChart() {
  return (
    <BeeBarChart
      config={chartConfig}
      data={data}
      xDataKey="bin"
      variant="histogram"
      showBrush={false}
      className="h-full w-full p-4"
    >
      <Grid />
      <XAxis dataKey="bin" />
      <YAxis />
      <Legend />
      <Tooltip />
      <Bar dataKey="count" />
    </BeeBarChart>
  );
}
