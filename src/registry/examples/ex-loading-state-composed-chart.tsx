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
  TRAFFIC_MONTHLY_DATA,
} from "@/registry/examples/example-shared";

export function NQExampleLoadingStateComposedChart() {
  return (
    <NQComposedChart
      config={DUAL_SERIES_CHART_CONFIG}
      data={[...TRAFFIC_MONTHLY_DATA]}
      xDataKey="month"
      className="h-full w-full p-4"
      isLoading
    >
      <Grid />
      <XAxis dataKey="month" />
      <YAxis />
      <Legend />
      <Tooltip />
      <Bar dataKey="desktop" />
      <Line dataKey="mobile" curveType="monotone" />
    </NQComposedChart>
  );
}
