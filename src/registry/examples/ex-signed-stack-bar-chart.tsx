"use client";

import { NQComposedChart, Bar, XAxis, YAxis, Grid, Legend } from "@/registry/charts/composed-chart";
import { type ChartConfig } from "@/registry/ui/chart";

const chartConfig = {
  gain: {
    label: "Gain",
    colors: { light: ["#047857"], dark: ["#34d399"] },
  },
  more: {
    label: "More",
    colors: { light: ["#1d4ed8"], dark: ["#93c5fd"] },
  },
  loss: {
    label: "Loss",
    colors: { light: ["#b45309"], dark: ["#fbbf24"] },
  },
  deeper: {
    label: "Deeper",
    colors: { light: ["#be123c"], dark: ["#fda4af"] },
  },
} satisfies ChartConfig;

/** Only the outer end of each same-sign stack is rounded. */
export function NQExampleSignedStackBarChart() {
  return (
    <NQComposedChart
      data={[{ x: "Jan", gain: 20000, more: 1000, loss: -7000, deeper: -500 }]}
      xDataKey="x"
      config={chartConfig}
      className="h-full w-full p-4"
      showBrush={false}
    >
      <Grid />
      <XAxis dataKey="x" />
      <YAxis />
      <Legend />
      <Bar dataKey="gain" stackId="s" />
      <Bar dataKey="more" stackId="s" />
      <Bar dataKey="loss" stackId="s" />
      <Bar dataKey="deeper" stackId="s" />
    </NQComposedChart>
  );
}
