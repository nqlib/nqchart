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
import { prepareParetoData } from "@/registry/lib/chart-recipes";
import { type ChartConfig } from "@/registry/ui/chart";

const raw = [
  { cause: "Late delivery", count: 42 },
  { cause: "Damaged item", count: 28 },
  { cause: "Wrong SKU", count: 18 },
  { cause: "Billing error", count: 12 },
  { cause: "Other", count: 8 },
];

const data = prepareParetoData(raw, "cause", "count");

const chartConfig = {
  count: {
    label: "Count",
    colors: { light: ["#3b82f6"], dark: ["#60a5fa"] },
  },
  cumulative: {
    label: "Cumulative %",
    colors: { light: ["#f59e0b"], dark: ["#fbbf24"] },
  },
} satisfies ChartConfig;

export function BeeExampleLoadingStateParetoChart() {
  return (
    <BeeComposedChart
      config={chartConfig}
      data={data}
      xDataKey="cause"
      className="h-full w-full p-4"
      isLoading
    >
      <Grid />
      <XAxis dataKey="cause" />
      <YAxis yAxisId="left" />
      <YAxis yAxisId="right" orientation="right" domain={[0, 100]} unit="%" />
      <Legend />
      <Tooltip />
      <Bar dataKey="count" barProps={{ yAxisId: "left" }} />
      <Line dataKey="cumulative" lineProps={{ yAxisId: "right" }} />
    </BeeComposedChart>
  );
}
