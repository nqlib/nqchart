"use client";

import { NQBarChart, Bar, XAxis, YAxis, Grid } from "@/registry/charts/bar-chart";
import { type ChartConfig } from "@/registry/ui/chart";

const chartConfig = {
  v: {
    label: "Value",
    colors: { light: ["#6d28d9"], dark: ["#c4b5fd"] },
  },
} satisfies ChartConfig;

/** Positive rounds on the right. Negative rounds on the left. */
export function NQExampleSignedHorizontalBarChart() {
  return (
    <NQBarChart
      data={[
        { x: "Pos", v: 5 },
        { x: "Neg", v: -5 },
      ]}
      xDataKey="x"
      layout="horizontal"
      config={chartConfig}
      className="h-full w-full p-4"
      showBrush={false}
    >
      <Grid />
      <XAxis />
      <YAxis />
      <Bar dataKey="v" />
    </NQBarChart>
  );
}
