"use client";

import {
  NQComposedChart,
  Bar,
  Line,
  Grid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "@/registry/charts/composed-chart";
import {
  DUAL_SERIES_CHART_CONFIG,
  formatMonthTickShort,
  TRAFFIC_MONTHLY_DATA,
} from "@/registry/examples/example-shared";

export function NQExampleComposedChart() {
  return (
    <NQComposedChart
      config={DUAL_SERIES_CHART_CONFIG}
      data={[...TRAFFIC_MONTHLY_DATA]}
      xDataKey="month"
      className="h-full w-full p-4"
    >
      <Grid />
      <XAxis dataKey="month" tickFormatter={formatMonthTickShort} />
      <YAxis />
      <Legend />
      <Tooltip />
      <Bar dataKey="desktop" />
      <Line dataKey="mobile" curveType="monotone" />
    </NQComposedChart>
  );
}
