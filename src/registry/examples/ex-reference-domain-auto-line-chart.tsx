"use client";

import { NQLineChart, Line, XAxis, YAxis, ReferenceLine } from "@/registry/charts/line-chart";
import { type ChartConfig } from "@/registry/ui/chart";

const data = [
  { month: "Jan", revenue: 120 },
  { month: "Feb", revenue: 132 },
  { month: "Mar", revenue: 128 },
  { month: "Apr", revenue: 141 },
  { month: "May", revenue: 155 },
];

const chartConfig = {
  revenue: {
    label: "Revenue",
    colors: { light: ["#047857"], dark: ["#34d399"] },
  },
} satisfies ChartConfig;

/** No caller max. The axis grows so the line at 80 stays on the plot. */
export function NQExampleReferenceDomainAutoLineChart() {
  return (
    <NQLineChart
      data={data}
      config={chartConfig}
      className="h-full w-full p-4"
      xDataKey="month"
      showBrush={false}
    >
      <XAxis dataKey="month" />
      <YAxis />
      <ReferenceLine y={80} />
      <Line dataKey="revenue" />
    </NQLineChart>
  );
}
