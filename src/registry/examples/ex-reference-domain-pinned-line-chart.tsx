"use client";

import { NQLineChart, Line, XAxis, YAxis, ReferenceLine } from "@/registry/charts/line-chart";
import { type ChartConfig } from "@/registry/ui/chart";

const data = [
  { month: "Jan", revenue: 12 },
  { month: "Feb", revenue: 22 },
  { month: "Mar", revenue: 18 },
  { month: "Apr", revenue: 28 },
  { month: "May", revenue: 34 },
];

const chartConfig = {
  revenue: {
    label: "Revenue",
    colors: { light: ["#047857"], dark: ["#34d399"] },
  },
} satisfies ChartConfig;

/** Caller-set max stays. The line at 80 is off the plot. */
export function NQExampleReferenceDomainPinnedLineChart() {
  return (
    <NQLineChart
      data={data}
      config={chartConfig}
      className="h-full w-full p-4"
      xDataKey="month"
      showBrush={false}
    >
      <XAxis dataKey="month" />
      <YAxis domain={[0, 40]} />
      <ReferenceLine y={80} includeInDomain={false} />
      <Line dataKey="revenue" />
    </NQLineChart>
  );
}
