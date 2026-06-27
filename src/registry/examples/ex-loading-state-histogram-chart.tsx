"use client";

import { BeeBarChart, Bar, Grid, XAxis, YAxis, Tooltip, Legend } from "@/registry/charts/bar-chart";
import { binForHistogram } from "@/registry/lib/chart-recipes";
import { type ChartConfig } from "@/registry/ui/chart";

const chartConfig = {
  count: {
    label: "Frequency",
    colors: {
      light: ["#059669"],
      dark: ["#34d399"],
    },
  },
} satisfies ChartConfig;

export function BeeExampleLoadingStateHistogramChart() {
  return (
    <BeeBarChart
      config={chartConfig}
      data={binForHistogram([12, 18, 24, 30, 36, 42, 48, 54], 4)}
      xDataKey="bin"
      variant="histogram"
      showBrush={false}
      className="h-full w-full p-4"
      isLoading
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
