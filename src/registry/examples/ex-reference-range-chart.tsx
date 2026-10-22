"use client";

import {
  NQLineChart,
  Line,
  XAxis,
  YAxis,
  Grid,
  Legend,
  Tooltip,
  ReferenceLine,
  ReferenceBand,
  RangeArea,
} from "@/registry/charts/line-chart";
import { type ChartConfig } from "@/registry/ui/chart";

const data = [
  { month: "Jan", revenue: 120, forecast: 128, low: 110, high: 146, index: 42 },
  { month: "Feb", revenue: 132, forecast: 140, low: 122, high: 158, index: 50 },
  { month: "Mar", revenue: 128, forecast: 150, low: null, high: 170, index: 46 },
  { month: "Apr", revenue: 141, forecast: 160, low: 148, high: 178, index: 64 },
  { month: "May", revenue: 155, forecast: 172, low: 158, high: 190, index: 78 },
];

const chartConfig = {
  revenue: {
    label: "Revenue",
    colors: { light: ["#047857"], dark: ["#34d399"] },
  },
  forecast: {
    label: "Forecast",
    colors: { light: ["#b45309"], dark: ["#fbbf24"] },
  },
  index: {
    label: "Index",
    colors: { light: ["#1d4ed8"], dark: ["#93c5fd"] },
  },
} satisfies ChartConfig;

export function NQExampleReferenceRangeChart() {
  return (
    <NQLineChart
      data={data}
      config={chartConfig}
      className="h-full w-full p-4"
      xDataKey="month"
      showBrush={false}
    >
      <Grid />
      <XAxis dataKey="month" />
      <YAxis yAxisId="left" />
      <YAxis yAxisId="right" orientation="right" />
      <Legend />
      <Tooltip />
      <RangeArea lowKey="low" highKey="high" yAxisId="left" tone="accent" label="Interval" />
      <ReferenceBand y={[190, null]} yAxisId="left" tone="warning" label="Above plan" />
      <ReferenceLine y={220} yAxisId="left" label="Stretch" tone="critical" />
      <ReferenceLine y={60} yAxisId="right" label="Index cap" tone="accent" />
      <Line dataKey="revenue" yAxisId="left" />
      <Line dataKey="forecast" yAxisId="left" variant="dashed" />
      <Line dataKey="index" yAxisId="right" />
    </NQLineChart>
  );
}
