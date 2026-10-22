"use client";

import { NQComposedChart, Bar, XAxis, YAxis, Grid } from "@/registry/charts/composed-chart";
import { type ChartConfig } from "@/registry/ui/chart";

const chartConfig = {
  a: {
    label: "Net",
    colors: { light: ["#6d28d9"], dark: ["#c4b5fd"] },
  },
} satisfies ChartConfig;

/** Positive end rounds away from zero. The end on zero stays square. */
export function NQExampleSignedBarChart() {
  return (
    <NQComposedChart
      data={[
        { x: "Jan", a: 12000 },
        { x: "Feb", a: -8000 },
      ]}
      xDataKey="x"
      config={chartConfig}
      className="h-full w-full p-4"
      showBrush={false}
    >
      <Grid />
      <XAxis dataKey="x" />
      <YAxis />
      <Bar dataKey="a" />
    </NQComposedChart>
  );
}
